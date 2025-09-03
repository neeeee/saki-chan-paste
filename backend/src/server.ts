import express from "express";
import cors from "cors";
import { nanoid } from "nanoid";

const app = express();
const PORT = process.env.PORT || 3001;

// In-memory storage (use a database in production)
const pastes: Map<string, { content: string; createdAt: Date }> = new Map();

app.use(cors());
app.use(express.json({ limit: "10mb" }));

// Create a new paste
app.post("/api/documents", (req, res) => {
  const { content } = req.body;

  if (!content || typeof content !== "string") {
    return res.status(400).json({ error: "Content is required" });
  }

  if (content.length > 1000000) {
    // 1MB limit
    return res.status(400).json({ error: "Content too large" });
  }

  const id = nanoid(10);
  pastes.set(id, {
    content,
    createdAt: new Date(),
  });

  res.json({ key: id });
});

// Get a paste by ID
app.get("/api/documents/:id", (req, res) => {
  const { id } = req.params;
  const paste = pastes.get(id);

  if (!paste) {
    return res.status(404).json({ error: "Document not found" });
  }

  res.json({
    data: paste.content,
    key: id,
  });
});

// Get raw paste content
app.get("/api/raw/:id", (req, res) => {
  const { id } = req.params;
  const paste = pastes.get(id);

  if (!paste) {
    return res.status(404).json({ error: "Document not found" });
  }

  res.set("Content-Type", "text/plain");
  res.send(paste.content);
});

// Health check
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", documents: pastes.size });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
