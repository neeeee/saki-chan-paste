import express from 'express';
import cors from 'cors';
import { nanoid } from 'nanoid';
import DatabaseManager from './database';

const app = express();
const PORT = process.env.PORT || 3001;

// Initialize database
const db = new DatabaseManager();

// Cleanup expired pastes every hour
setInterval(() => {
  const deleted = db.cleanupExpiredPastes();
  if (deleted > 0) {
    console.log(`Cleaned up ${deleted} expired pastes`);
  }
}, 60 * 60 * 1000);

app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Create a new paste
app.post('/api/documents', (req, res) => {
  const { content, expiresInHours } = req.body;
  
  if (!content || typeof content !== 'string') {
    return res.status(400).json({ error: 'Content is required' });
  }

  if (content.length > 1000000) { // 1MB limit
    return res.status(400).json({ error: 'Content too large' });
  }

  if (expiresInHours && (typeof expiresInHours !== 'number' || expiresInHours <= 0)) {
    return res.status(400).json({ error: 'Invalid expiration time' });
  }

  try {
    const id = nanoid(10);
    const paste = db.createPaste(id, content, expiresInHours);
    
    res.json({ 
      key: id,
      expires_at: paste.expires_at 
    });
  } catch (error) {
    console.error('Error creating paste:', error);
    res.status(500).json({ error: 'Failed to create paste' });
  }
});

// Get a paste by ID
app.get('/api/documents/:id', (req, res) => {
  const { id } = req.params;
  
  try {
    const paste = db.getPaste(id);

    if (!paste) {
      return res.status(404).json({ error: 'Document not found' });
    }

    res.json({
      data: paste.content,
      key: id,
      created_at: paste.created_at,
      expires_at: paste.expires_at,
      view_count: paste.view_count
    });
  } catch (error) {
    console.error('Error fetching paste:', error);
    res.status(500).json({ error: 'Failed to fetch paste' });
  }
});

// Get raw paste content
app.get('/api/raw/:id', (req, res) => {
  const { id } = req.params;
  
  try {
    const paste = db.getPaste(id);

    if (!paste) {
      return res.status(404).json({ error: 'Document not found' });
    }

    res.set('Content-Type', 'text/plain');
    res.send(paste.content);
  } catch (error) {
    console.error('Error fetching raw paste:', error);
    res.status(500).json({ error: 'Failed to fetch paste' });
  }
});

// Delete a paste
app.delete('/api/documents/:id', (req, res) => {
  const { id } = req.params;
  
  try {
    const deleted = db.deletePaste(id);
    
    if (!deleted) {
      return res.status(404).json({ error: 'Document not found' });
    }

    res.json({ message: 'Document deleted successfully' });
  } catch (error) {
    console.error('Error deleting paste:', error);
    res.status(500).json({ error: 'Failed to delete paste' });
  }
});

// Get recent pastes
app.get('/api/recent', (req, res) => {
  const limit = parseInt(req.query.limit as string) || 10;
  
  try {
    const pastes = db.getRecentPastes(Math.min(limit, 50)); // Max 50
    res.json(pastes);
  } catch (error) {
    console.error('Error fetching recent pastes:', error);
    res.status(500).json({ error: 'Failed to fetch recent pastes' });
  }
});

// Get statistics
app.get('/api/stats', (req, res) => {
  try {
    const stats = db.getStats();
    res.json(stats);
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

// Health check
app.get('/api/health', (req, res) => {
  try {
    const stats = db.getStats();
    res.json({ 
      status: 'ok', 
      database: 'connected',
      ...stats
    });
  } catch (error) {
    res.status(500).json({ 
      status: 'error', 
      database: 'disconnected' 
    });
  }
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('Shutting down gracefully...');
  db.close();
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('Shutting down gracefully...');
  db.close();
  process.exit(0);
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
