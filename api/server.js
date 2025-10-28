import express from 'express';
import cors from 'cors';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import NodeCache from 'node-cache';
import dotenv from 'dotenv';
import createSessionsRouter from './routes/sessions.js';
import createMappingsRouter from './routes/mappings.js';
import createMessagesRouter from './routes/messages.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3005;
const isDev = process.env.NODE_ENV !== 'production';
const messageMappingCache = new NodeCache({ stdTTL: 3600, checkperiod: 120 });

// Global error handlers to prevent server crashes
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  console.error('Stack:', error.stack);
  // Don't exit the process - keep server running
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise);
  console.error('Reason:', reason);
  // Don't exit the process - keep server running
});

// Serve static files in production
if (!isDev) {
  app.use(express.static(path.join(__dirname, '..')));
}

// Middleware
app.use(cors());
app.use(express.json());

// Ensure data directory exists and initialize files
const dataDir = path.join(__dirname, 'data');
const MAPPINGS_FILE = path.join(dataDir, 'mappings.json');
const SESSIONS_FILE = path.join(dataDir, 'sessions.json');

async function initializeDataFiles() {
  try {
    await fs.mkdir(dataDir, { recursive: true });

// Initialize files if they don't exist
try {
  await fs.access(MAPPINGS_FILE);
} catch {
  await fs.writeFile(MAPPINGS_FILE, '{}');
}

try {
  await fs.access(SESSIONS_FILE);
} catch {
  await fs.writeFile(SESSIONS_FILE, '[]');
}
    console.log('Data files initialized successfully');
  } catch (error) {
    console.error('Error initializing data files:', error);
    // Don't crash - server will still run, but file operations might fail
  }
}

// Initialize data files
await initializeDataFiles();

// Register route modules
app.use('/api/sessions', createSessionsRouter(SESSIONS_FILE));
app.use('/api/sessions', createMappingsRouter(MAPPINGS_FILE));
app.use('/api', createMessagesRouter(MAPPINGS_FILE, SESSIONS_FILE, messageMappingCache));

// Express error handling middleware - must be after all routes
app.use((err, req, res, next) => {
  console.error('Express error handler caught:', err);
  console.error('Stack:', err.stack);
  
  // Send error response if headers haven't been sent
  if (!res.headersSent) {
    res.status(500).json({ 
      error: 'Internal server error', 
      message: err.message 
    });
  }
});

// Handle 404 for undefined routes
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
}).on('error', (error) => {
  console.error('Server error:', error);
  // Don't exit - try to recover
});
