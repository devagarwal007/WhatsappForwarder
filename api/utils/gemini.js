import {
  GoogleGenAI,
  HarmCategory,
  HarmBlockThreshold,
  Type as SchemaType} from "@google/genai";
import history from "./history.js";
import NodeCache from "node-cache";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

const apiKeys = (process.env.GEMINI_API_KEYS || "").split(",").map(k => k.trim()).filter(Boolean);

// Use NodeCache for rate-limited keys, TTL set to 24 hours (86400 seconds)
const rateLimitCache = new NodeCache({ stdTTL: 86400, checkperiod: 3600 });

function getNextAvailableKey() {
  for (const key of apiKeys) {
    if (!rateLimitCache.get(key)) return key;
  }
  return null;
}

function markKeyRateLimited(key) {
  rateLimitCache.set(key, 1);
}

const MODEL_NAME = "gemini-2.5-flash-lite";

// Helper to create a new GoogleGenAI instance for a given key
function createGenAI(apiKey) {
  return new GoogleGenAI({ apiKey });
}

const safetySettings = [
  {
    category: HarmCategory.HARM_CATEGORY_HARASSMENT,
    threshold: HarmBlockThreshold.BLOCK_NONE,
  },
  {
    category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
    threshold: HarmBlockThreshold.BLOCK_NONE,
  },
  {
    category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
    threshold: HarmBlockThreshold.BLOCK_NONE,
  },
  {
    category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
    threshold: HarmBlockThreshold.BLOCK_NONE,
  },
];

// const model = genAI.getGenerativeModel({
//   model: MODEL_NAME,
//   systemInstruction:
//     'You will receive a textual input. Your task is to extract all main item prices from the text and return them in a JSON array following these rules:\n\nFormat Preservation:\n\nIf the extracted price originally contains a comma (e.g., @8,499/-), preserve the comma in the output.\nExample:\nInput: @8,499/-\nOutput: ["8,499"]\n\nIf the extracted price does not contain a comma (e.g., @8499/-), output it as a pure number.\nExample:\nInput: @8499/-\nOutput: [8499]\n\nExtraction Rules:\n\nStrip away any currency symbols, rate indicators, or trailing characters (such as /-, $, @, etc.), leaving only the numeric portion.\nIf multiple prices are present, output all of them in a single JSON array following the same formatting rules.\nDo not include shipping charges, carry bag charges, or size-related costs.\nOutput Requirements:\n\nReturn the result as a JSON array.\nFor prices without commas, return them as plain numbers (no quotes).\nFor prices with commas, return them as strings (with double quotes) to ensure valid JSON format.\nNo additional text or explanation should appear outside the JSON array.\nExamples:\n\nInput:\n@8,499/-\nOutput:\n["8,499"]\n\nInput:\n@8499/-\nOutput:\n["8499"]\n\nInput:\n\nBuy anyone @just. 1699\nBuy any 2 @just. 8,499 each\nOutput:\n["1699","8,499"]\n\nExample 1:\nInput: @1,999/-\nOutput: ["1,999"]\n\nExample 2:\nInput: Price: 2400/- only\nOutput: ["2400"]\n\nExample 3:\nInput: Special offer @6,750/- per piece\nOutput: ["6,750"]\n\nExample 4:\nInput: Just Rs. 500/-\nOutput: ["500"]\n\nExample 5:\nInput: @2,05,000/- final price\nOutput: ["2,05,000"]\n\nExample 6:\nInput: Grab now @8500 only\nOutput: ["8500"]\n\nExample 7:\nInput: Exclusive deal @4,49,999/-\nOutput: ["4,49,999"]\n\nExample 8:\nInput: New Arrival: 200/- each\nOutput: ["200"]\n\nExample 9:\nInput: Offer price: @12,500/- plus shipping extra\nOutput: ["12,500"]\n\nExample 10:\nInput: Limited time deal 999/- only\nOutput: ["999"]\n\nExample 1 (Shipping Price):\nInput: "This product costs @1,500/- and shipping 100 extra"\nOutput: ["1500"]\n(Do not include "100" because it’s for shipping)\n\nExample 2 (Carry Bag Price):\nInput: "Optical frame @1,350/- with original box and CARRYBAG 100 EXTRA"\nOutput: ["1350"]\n(Do not include "100" because it’s for carry bag)\n\nExample 3 (Mixed):\nInput: "Exclusive deal @2,999/- plus CARRYBAG 50 EXTRA and SHIPPING 200/-"\nOutput: ["2,999"]\n(Do not include "50" or "200" because they are for carry bag and shipping)\n\nExample 4 (No Valid Item Price):\nInput: "Free shipping on all orders, CARRYBAG charge 50"\nOutput: []\n(No item price, only shipping and carry bag charges)\n\nExample 5 (Multiple Prices, One is Shipping):\nInput: "Deal: @1,500/- each, or @2,800/- for two sets, Shipping 100 extra"\nOutput: ["1,500","2,800"]',
// });

const generationConfig = {
  temperature: 1,
  topP: 0.95,
  topK: 40,
  maxOutputTokens: 8192,
  responseMimeType: "application/json",
  responseSchema: {
    type: SchemaType.OBJECT,
    properties: {
      response: {
        type: SchemaType.ARRAY,
        items: {
          type: SchemaType.STRING,
        },
      },
    },
    required: [
      "response",
    ]
  },
  systemInstruction: 'You will receive a textual input. Your task is to extract all main item prices from the text and return them in a JSON array following these rules:\n\nFormat Preservation:\n\nIf the extracted price originally contains a comma (e.g., @8,499/-), preserve the comma in the output.\nExample:\nInput: @8,499/-\nOutput: ["8,499"]\n\nIf the extracted price does not contain a comma (e.g., @8499/-), output it as a pure number.\nExample:\nInput: @8499/-\nOutput: [8499]\n\nExtraction Rules:\n\nStrip away any currency symbols, rate indicators, or trailing characters (such as /-, $, @, etc.), leaving only the numeric portion.\nIf multiple prices are present, output all of them in a single JSON array following the same formatting rules.\nDo not include shipping charges, carry bag charges, or size-related costs.\nOutput Requirements:\n\nReturn the result as a JSON array.\nFor prices without commas, return them as plain numbers (no quotes).\nFor prices with commas, return them as strings (with double quotes) to ensure valid JSON format.\nNo additional text or explanation should appear outside the JSON array.\nExamples:\n\nInput:\n@8,499/-\nOutput:\n["8,499"]\n\nInput:\n@8499/-\nOutput:\n["8499"]\n\nInput:\n\nBuy anyone @just. 1699\nBuy any 2 @just. 8,499 each\nOutput:\n["1699","8,499"]\n\nExample 1:\nInput: @1,999/-\nOutput: ["1,999"]\n\nExample 2:\nInput: Price: 2400/- only\nOutput: ["2400"]\n\nExample 3:\nInput: Special offer @6,750/- per piece\nOutput: ["6,750"]\n\nExample 4:\nInput: Just Rs. 500/-\nOutput: ["500"]\n\nExample 5:\nInput: @2,05,000/- final price\nOutput: ["2,05,000"]\n\nExample 6:\nInput: Grab now @8500 only\nOutput: ["8500"]\n\nExample 7:\nInput: Exclusive deal @4,49,999/-\nOutput: ["4,49,999"]\n\nExample 8:\nInput: New Arrival: 200/- each\nOutput: ["200"]\n\nExample 9:\nInput: Offer price: @12,500/- plus shipping extra\nOutput: ["12,500"]\n\nExample 10:\nInput: Limited time deal 999/- only\nOutput: ["999"]\n\nExample 1 (Shipping Price):\nInput: "This product costs @1,500/- and shipping 100 extra"\nOutput: ["1500"]\n(Do not include "100" because it’s for shipping)\n\nExample 2 (Carry Bag Price):\nInput: "Optical frame @1,350/- with original box and CARRYBAG 100 EXTRA"\nOutput: ["1350"]\n(Do not include "100" because it’s for carry bag)\n\nExample 3 (Mixed):\nInput: "Exclusive deal @2,999/- plus CARRYBAG 50 EXTRA and SHIPPING 200/-"\nOutput: ["2,999"]\n(Do not include "50" or "200" because they are for carry bag and shipping)\n\nExample 4 (No Valid Item Price):\nInput: "Free shipping on all orders, CARRYBAG charge 50"\nOutput: []\n(No item price, only shipping and carry bag charges)\n\nExample 5 (Multiple Prices, One is Shipping):\nInput: "Deal: @1,500/- each, or @2,800/- for two sets, Shipping 100 extra"\nOutput: ["1,500","2,800"]',
  safetySettings: safetySettings
};

/**
 * Generates a response from the model based on a given user input string.
 * @param userInput - The string you want to pass to the model.
 * @returns The model's text response.
 */
const runChat = async (userProvidedMessage, priceUpdateValue) => {
  try {
    const userContents = {
      role: 'user',
      parts: [ { text: userProvidedMessage } ],
    };

    let lastError = null;
    let triedKeys = 0;
    let key = null;

    while ((key = getNextAvailableKey()) !== null) {
      console.log(`Using API key: ${key}`);
      const genAI = createGenAI(key);
      try {
        const chatSession = await genAI.models.generateContent({
          model: MODEL_NAME,
          config: generationConfig,
          contents: [...history, userContents],
        });
        let result = chatSession.text;      
        if (!result) {
          console.error("No valid response from the model.");
          return null;
        }
        result = result.replace('```json', '').replace('```', '').trim();
        console.log("Model response:", result);
        const parsedResponse = JSON.parse(result);

        // If no valid price is found, return null.
        if (parsedResponse.response.length === 0) {
          return null;
        }

        const finalResult = replaceMessage(
          userProvidedMessage,
          result,
          priceUpdateValue
        );
        console.log(finalResult);
        return finalResult;
      } catch (err) {
        lastError = err;

        const error = err;
        //console.error(`Error with key ${key}:`,  error.message);
        if (err && error && error.message && error.message.includes("429") && error.message.includes("RESOURCE_EXHAUSTED")) {
          markKeyRateLimited(key);
          triedKeys++;
          continue; // Try next key
        } else {
          // Other error, don't retry
          console.error("Error in genAI call:", err);
          return null;
        }
      }
    }
    // All keys exhausted or rate-limited
    console.error("All API keys are rate-limited or invalid.", lastError);
    return null;
  } catch (error) {
    // Catch any unexpected errors in the entire function
    console.error("Unexpected error in runChat:", error);
    return null;
  }
}

/**
 * Extracts lines from the message that contain numeric values.
 *
 * @param {string} message - The input message.
 * @returns {string[]} An array of lines containing numbers.
 */
function getPriceLines(message) {
  return message.split("\n").filter((line) => /\d+/.test(line));
}

/**
 * Increments and replaces price values in the original message.
 *
 * @param {string} message - The original message.
 * @param {string[]} formattedValues - Array of extracted price strings.
 * @param {number|string} incrementAmount - The amount to add to each price.
 * @returns {string} The updated message with incremented price values.
 */
function incrementAndReplace(message, formattedValues, incrementAmount) {
  try {
    if (!message || !formattedValues || !Array.isArray(formattedValues)) {
      console.error("Invalid input to incrementAndReplace");
      return message;
    }
    
    // Map each formatted value to an object with its numeric representation.
    const valuesWithNumbers = formattedValues.map((value) => ({
      original: value,
      number: parseInt(value.replace(/,/g, ""), 10),
    }));

    // Sort values in descending order to avoid substring replacement issues.
    valuesWithNumbers.sort((a, b) => b.number - a.number);

    return valuesWithNumbers.reduce((acc, { original, number }) => {
      try {
        const incrementedNumber = number + parseInt(incrementAmount, 10);
        // Escape commas in the original string for the regex.
        const regex = new RegExp(original.replace(/,/g, "\\,"), "g");
        return acc.replace(regex, incrementedNumber.toString());
      } catch (error) {
        console.error("Error processing price:", original, error);
        return acc;
      }
    }, message);
  } catch (error) {
    console.error("Error in incrementAndReplace:", error);
    return message;
  }
}

/**
 * Replaces price values in the original message using the generative model's response.
 *
 * @param {string} originalMessage - The original input message.
 * @param {string} responseMessage - The JSON string response from the model.
 * @param {number|string} priceUpdateValue - The value to add to the extracted prices.
 * @returns {string|null} The message with updated prices or null if an error occurs.
 */
function replaceMessage(originalMessage, responseMessage, priceUpdateValue) {
  try {
    const parsed = JSON.parse(responseMessage);
    
    if (!parsed || !parsed.response || !Array.isArray(parsed.response)) {
      console.error("Invalid response format:", responseMessage);
      return null;
    }
    
    const extractedPrices = parsed.response;

    // Increment and replace all extracted price values in the original message.
    return incrementAndReplace(
      originalMessage,
      extractedPrices,
      priceUpdateValue
    );
  } catch (error) {
    console.error("Error in replaceMessage:", error);
    console.error("Original message:", originalMessage);
    console.error("Response message:", responseMessage);
    return null;
  }
}

export default runChat;
