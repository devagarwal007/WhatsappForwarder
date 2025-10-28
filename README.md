# WhatsApp Forwarder

A web application for managing WhatsApp message forwarding rules with filters and price adjustments.

## Features

- Create and manage forwarding sessions
- Setup message forwarding rules between WhatsApp chats
- Filter messages based on keywords or regex patterns
- Automatically adjust prices in forwarded messages
- Store configuration in JSON files
- Dark/Light mode support

## Development Setup

1. Install dependencies:
```bash
npm install
```

2. Start the development server:
```bash
npm run dev
```

This will start both the Vite development server for the frontend and the Express API server.

## Production Build

To create a static build:

1. Build the application:
```bash
npm run build
```

This will:
- Build the React frontend
- Copy the API server and its files to the dist directory
- Set up the necessary permissions

2. Start the production server:
```bash
npm run start
```

The application will be available at http://localhost:3000

## Project Structure

- `/src` - React frontend code
- `/api` - Express API server
  - `/api/data` - JSON storage directory
- `/dist` - Production build output

## API Endpoints

- `GET /api/sessions` - Get all sessions
- `POST /api/sessions` - Create a new session
- `GET /api/sessions/:id/mappings` - Get mappings for a session
- `POST /api/sessions/:id/mappings` - Create a new mapping
- `DELETE /api/sessions/:sessionId/mappings/:mappingId` - Delete a mapping
- `POST /api/forward-message` - Forward a message according to rules

## Environment Variables

- `PORT` - Server port (default: 3000)