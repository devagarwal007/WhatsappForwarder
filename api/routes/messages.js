import express from 'express';
import fs from 'fs/promises';
import axios from 'axios';
import runChat from '../utils/gemini.js';

const router = express.Router();

// Helper function to add mapping
function addMapping(messageMappingCache, sourceMessageId, mappingInfo) {
  console.log('Adding mapping:', sourceMessageId, mappingInfo);
  const existing = messageMappingCache.get(sourceMessageId) || [];
  existing.push(mappingInfo);
  messageMappingCache.set(sourceMessageId, existing);
}

// Message handling routes
export function createMessagesRouter(MAPPINGS_FILE, SESSIONS_FILE, messageMappingCache) {
  
  // Forward message endpoint
  router.post('/forward-message', async (req, res) => {
    try {
      console.log('Incoming message');
      const { session, payload } = req.body;
      const { id: payloadId, from: sourceId, body, media, hasMedia, _data } = payload;
      const actualMessageId = _data?.key?.id || payloadId;
      
      // Read session and mapping files for routing
      const data = await fs.readFile(MAPPINGS_FILE, 'utf8');
      const sessionFile = await fs.readFile(SESSIONS_FILE, 'utf8');
      const mappings = JSON.parse(data);
      const sessionFileData = JSON.parse(sessionFile);
      const defaultSession = sessionFileData.find(s => s.name === 'default');
      const sessionId = defaultSession?.id;
      const sessionBaseUrl = defaultSession?.baseUrl;
      const sessionApiKey = defaultSession?.apiKey;
      const sessionMappings = mappings[sessionId] || [];

      // Prepare headers with API key if available
      const apiHeaders = {
        'Content-Type': 'application/json'
      };
      if (sessionApiKey) {
        apiHeaders['X-Api-Key'] = sessionApiKey;
      }

      // Find relevant mappings for the source chat
      const relevantMappings = sessionMappings.filter(
        mapping => mapping.source.id === sourceId
      );
      
      if (!relevantMappings || relevantMappings.length === 0) {
        return res.status(200).json({ success: true, forwardedTo: [] });
      }
      
      // Skip forwarding if the text (without media) does not contain any digit
      if (body && body.length > 0 && !/\d/.test(body) && !hasMedia) {
        return res.status(200).json({ success: true, message: "Message does not contain a digit" });
      }
      
      const forwardedTo = [];

      for (const mapping of relevantMappings) {
        let shouldForward = false;
        let processedMessage = body;

        if (mapping.filter?.disabled) {
          console.log('Mapping is disabled. Not forwarding.');
          return res.status(200).json({ success: true, message: "Mapping is disabled" });
        }
        
        if (mapping.filter?.returnIfContainsLink && body && /https?:\/\/\S+/.test(body)) {
          console.log('Message contains a link. Not forwarding.');
          return res.status(200).json({ success: true, message: "ok" });
        }

        if (
          mapping.filter?.returnIfContainsPhoneNumber &&
          body &&
          (/(?:\+?\d{1,3}[-.\s()]*)?\d{7,}/.test(body) ||
           /\+?\d[\d -]{8,12}\d/g.test(body))
        ) {
          console.log('Message contains a phone number. Not forwarding.');
          return res.status(200).json({ success: true, message: "Message contains a phone number" });
        }

        if (hasMedia && mapping.filter?.ignoredMediaMimetypes && mapping.filter.ignoredMediaMimetypes.length > 0) {
          const mediaMime = media?.mimetype || '';
          const ignoreMedia = mapping.filter.ignoredMediaMimetypes.some(typeStr => mediaMime.includes(typeStr));
          if (ignoreMedia) {
            console.log('Media mimetype matches ignored filter. Not forwarding.');
            return res.status(200).json({ success: true, message: "Media mimetype matches ignored filter" });
          }
        }

        // Check regex pattern if specified
        if (mapping.filter?.regex && processedMessage && processedMessage.length > 0) {
          const regex = new RegExp(mapping.filter.regex);
          shouldForward = regex.test(processedMessage);
          if (shouldForward) {
            return res.status(200).json({ success: true, message: "Regex match found" });
          }
        }

        // Apply price adjustment if needed
        if (processedMessage && processedMessage.length > 0 &&
        mapping.filter?.priceAdjustment && mapping.filter.priceAdjustment > 0) {
          processedMessage = await runChat(processedMessage, mapping.filter.priceAdjustment);
          console.log('Price adjusted message:', processedMessage);

          if (!processedMessage || processedMessage.length === 0) {
            // Fire-and-forget notification with error handling
            axios.post(`https://ntfy.sh/pri_wahaui_message_ai_response`, {
              status: 'gemini failed',
              destinationChatName: mapping.destination.name, 
              sourceChatName: mapping.source.name,
              IncomingMessage: body,
              priceAdjustment: mapping.filter.priceAdjustment
            }).catch(error => {
              console.error('Error sending notification:', error.message);
            });
          }
        }

        console.log('Price adjusted message:', shouldForward, processedMessage);
        
        if ((processedMessage || hasMedia)) {
          if (processedMessage && processedMessage.length > 0) {

            // Skip forwarding if the text (without media) does not contain any digit
            if (!/\d/.test(processedMessage)) {
              return res.status(200).json({ success: true, message: "Message does not contain a digit" });
            }
            
            // Prepare payload for sending text
            const sendTextPayload = {
              chatId: mapping.destination.id,
              reply_to: null,
              text: processedMessage,
              linkPreview: true,
              session
            };

            // Send text and capture the forwarded message id
            const response = await axios.post(`${sessionBaseUrl}/api/sendText`, sendTextPayload, { headers: apiHeaders });
            console.log('Response from sendText:', response.data);
            const forwardedMessageId = response.data.key?.id;
            
            console.log('Forwarded text message with id:', forwardedMessageId , ' actual ', actualMessageId);

            // Save mapping in cache
            addMapping(messageMappingCache, actualMessageId, { destinationId: mapping.destination.id, messageId: forwardedMessageId });
            forwardedTo.push({ destinationId: mapping.destination.id, messageId: forwardedMessageId });
            
            // Fire-and-forget notification with error handling
            axios.post(`https://ntfy.sh/pri_wahaui_message_forward_details`, {
               destinationChatName: mapping.destination.name, 
               sourceChatName: mapping.source.name, 
               processedMessage,
               IncomingMessage: body,
               priceAdjustment: mapping.filter?.priceAdjustment
            }).catch(error => {
              console.error('Error sending forward notification:', error.message);
            });
            
            console.log('Sent updated text:', processedMessage);
            
          } else if (hasMedia) {
            // For media-only messages, forward the media message
            const forwardPayload = {
              chatId: mapping.destination.id,
              messageId: payloadId,
              session
            };
            const response = await axios.post(`${sessionBaseUrl}/api/forwardMessage`, forwardPayload, { headers: apiHeaders });
            const forwardedMessageId = response.data?._data?.key?.id || response.data?.id;

            console.log('Forwarded media message with id:', forwardedMessageId , ' actual ', actualMessageId);

            addMapping(messageMappingCache, actualMessageId, { destinationId: mapping.destination.id, messageId: forwardedMessageId });
            forwardedTo.push({ destinationId: mapping.destination.id, messageId: forwardedMessageId });
          }
        }
      }
      
      res.json({ success: true, forwardedTo });
    } catch (error) {
      console.error('Error forwarding message:', error);
      res.status(200).json({ error: 'Failed to forward message' });
    }
  });

  // Message revoked endpoint
  router.post('/message-revoked', async (req, res) => {
    try {
      const { session, payload } = req.body;
      const revokedSourceMessageId = payload._data?.message?.protocolMessage?.key?.id || payload.before?.id || payload.after?.id;
      const sessionFile = await fs.readFile(SESSIONS_FILE, 'utf8');
      const sessionFileData = JSON.parse(sessionFile);
      const defaultSession = sessionFileData.find(s => s.name === 'default');
      const sessionBaseUrl = defaultSession?.baseUrl;
      const sessionApiKey = defaultSession?.apiKey;

      // Prepare headers with API key if available
      const apiHeaders = {};
      if (sessionApiKey) {
        apiHeaders['X-Api-Key'] = sessionApiKey;
      }

      if (!revokedSourceMessageId) {
        console.error('Invalid payload: no message id');
        return res.status(200).json({ success: false, message: "Invalid payload: no message id" });
      }
      
      const mappingEntry = messageMappingCache.get(revokedSourceMessageId);
      if (!mappingEntry || mappingEntry.length === 0) {
        console.log('No forwarded messages found for revocation:', revokedSourceMessageId);
        return res.status(200).json({ success: true, message: "No forwarded messages found for revocation" });
      }

      console.log('Revoking forwarded messages:', revokedSourceMessageId, mappingEntry);
      
      // Delete each forwarded message using the DELETE endpoint
      for (const dest of mappingEntry) {
        await axios.delete(`${sessionBaseUrl}/api/${session}/chats/${dest.destinationId}/messages/true_${dest.destinationId}_${dest.messageId}`, { headers: apiHeaders });
        console.log(`Deleted forwarded message ${dest.messageId} in chat ${dest.destinationId}`);
      }
      
      // Remove mapping from the cache
      messageMappingCache.del(revokedSourceMessageId);
      
      res.json({ success: true, message: "Forwarded messages deleted" });
    } catch (error) {
      console.error('Error handling message revoke:', error);
      res.status(200).json({ error: 'Failed to delete forwarded messages' });
    }
  });

  return router;
}

export default createMessagesRouter;

