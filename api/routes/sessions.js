import express from 'express';
import fs from 'fs/promises';

const router = express.Router();

// Session routes
export function createSessionsRouter(SESSIONS_FILE) {
  
  // Get all sessions
  router.get('/', async (req, res) => {
    try {
      const data = await fs.readFile(SESSIONS_FILE, 'utf8');
      res.json(JSON.parse(data));
    } catch (error) {
      console.error('Error reading sessions:', error);
      res.status(500).json({ error: 'Failed to read sessions' });
    }
  });

  // Get single session by ID
  router.get('/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const sessionFile = await fs.readFile(SESSIONS_FILE, 'utf8');
      const sessionFileData = JSON.parse(sessionFile);
      const session = sessionFileData.find(s => s.name === 'default');
      const sessionBaseUrl = session?.baseUrl;
      const sessionApiKey = session?.apiKey;

      const headers = {};
      if (sessionApiKey) {
        headers['X-Api-Key'] = sessionApiKey;
      }

      const response = await fetch(`${sessionBaseUrl}/api/sessions/${id}`, {
        method: 'GET',
        headers,
      });
      if (!response.ok) {
        throw new Error('Failed to complete scan');
      }
      res.json(await response.json());
    } catch (error) {
      console.error('Error reading sessions:', error);
      res.status(500).json({ error: 'Failed to read sessions' });
    }
  });

  // Get groups for a session
  router.get('/:id/groups', async (req, res) => {
    try {
      const { id } = req.params;
      const { limit, offset } = req.query;
      const sessionFile = await fs.readFile(SESSIONS_FILE, 'utf8');
      const sessionFileData = JSON.parse(sessionFile);
      const session = sessionFileData.find(s => s.name === 'default');
      const sessionBaseUrl = session?.baseUrl;
      const sessionApiKey = session?.apiKey;

      const headers = {};
      if (sessionApiKey) {
        headers['X-Api-Key'] = sessionApiKey;
      }

      const response = await fetch(
        `${sessionBaseUrl}/api/${id}/groups?limit=${limit}&offset=${offset}`,
        { headers }
      );
      const data = await response.json();
      res.status(200).json(data);
    } catch (error) {
      console.error('Error reading sessions:', error);
      res.status(500).json({ error: 'Failed to read sessions' });
    }
  });

  // Create or update session
  router.post('/', async (req, res) => {
    try {
      const newSession = req.body;
      const data = await fs.readFile(SESSIONS_FILE, 'utf8');
      const sessions = JSON.parse(data);
      
      // Find existing session index
      const existingSessionIndex = sessions.findIndex(
        session => session.id === newSession.id
      );

      if (existingSessionIndex !== -1) {
        // Update existing session
        sessions[existingSessionIndex] = {
          ...sessions[existingSessionIndex],
          ...newSession
        };
      } else {
        // Add new session if not found
        sessions.push(newSession);
      }

      await fs.writeFile(SESSIONS_FILE, JSON.stringify(sessions, null, 2));
      res.json(existingSessionIndex !== -1 ? sessions[existingSessionIndex] : newSession);
    } catch (error) {
      console.error('Error managing session:', error);
      res.status(500).json({ error: 'Failed to manage session' });
    }
  });

  // Delete session
  router.delete('/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const data = await fs.readFile(SESSIONS_FILE, 'utf8');
      const sessions = JSON.parse(data);
      
      // Filter out the session to delete
      const updatedSessions = sessions.filter(session => session.id !== id);
      
      if (updatedSessions.length === sessions.length) {
        return res.status(404).json({ error: 'Session not found' });
      }
      
      await fs.writeFile(SESSIONS_FILE, JSON.stringify(updatedSessions, null, 2));
      res.json({ success: true, message: 'Session deleted successfully' });
    } catch (error) {
      console.error('Error deleting session:', error);
      res.status(500).json({ error: 'Failed to delete session' });
    }
  });

  return router;
}

export default createSessionsRouter;

