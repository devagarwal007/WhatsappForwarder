import express from 'express';
import fs from 'fs/promises';

const router = express.Router();

// Mapping routes
export function createMappingsRouter(MAPPINGS_FILE) {
  
  // Get mappings for a session
  router.get('/:id/mappings', async (req, res) => {
    try {
      const { id } = req.params;
      const data = await fs.readFile(MAPPINGS_FILE, 'utf8');
      const mappings = JSON.parse(data);
      res.json(mappings[id] || []);
    } catch (error) {
      console.error('Error reading mappings:', error);
      res.status(500).json({ error: 'Failed to read mappings' });
    }
  });

  // Create mapping for a session
  router.post('/:id/mappings', async (req, res) => {
    try {
      const { id } = req.params;
      const newMapping = req.body;
      const data = await fs.readFile(MAPPINGS_FILE, 'utf8');
      const mappings = JSON.parse(data);
      
      if (!mappings[id]) {
        mappings[id] = [];
      }
      
      mappings[id].push(newMapping);
      await fs.writeFile(MAPPINGS_FILE, JSON.stringify(mappings, null, 2));
      res.json(newMapping);
    } catch (error) {
      console.error('Error creating mapping:', error);
      res.status(500).json({ error: 'Failed to create mapping' });
    }
  });

  // Delete mapping
  router.delete('/:sessionId/mappings/:mappingId', async (req, res) => {
    try {
      const { sessionId, mappingId } = req.params;
      const data = await fs.readFile(MAPPINGS_FILE, 'utf8');
      const mappings = JSON.parse(data);
      
      if (mappings[sessionId]) {
        mappings[sessionId] = mappings[sessionId].filter(
          mapping => mapping.id !== mappingId
        );
        await fs.writeFile(MAPPINGS_FILE, JSON.stringify(mappings, null, 2));
      }
      
      res.json({ success: true });
    } catch (error) {
      console.error('Error deleting mapping:', error);
      res.status(500).json({ error: 'Failed to delete mapping' });
    }
  });

  // Update mapping
  router.put('/:sessionId/mappings/:mappingId', async (req, res) => {
    try {
      const { sessionId, mappingId } = req.params;
      const updatedMapping = req.body;
      const data = await fs.readFile(MAPPINGS_FILE, 'utf8');
      const mappings = JSON.parse(data);

      if (!mappings[sessionId]) {
        return res.status(404).json({ error: 'Session not found' });
      }

      const index = mappings[sessionId].findIndex(m => m.id === mappingId);
      if (index === -1) {
        return res.status(404).json({ error: 'Mapping not found' });
      }

      mappings[sessionId][index] = updatedMapping;
      await fs.writeFile(MAPPINGS_FILE, JSON.stringify(mappings, null, 2));
      res.json(updatedMapping);
    } catch (error) {
      console.error('Error updating mapping:', error);
      res.status(500).json({ error: 'Failed to update mapping' });
    }
  });

  return router;
}

export default createMappingsRouter;

