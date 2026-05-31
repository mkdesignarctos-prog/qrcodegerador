import express from 'express';
import path from 'path';
import crypto from 'crypto';
import multer from 'multer';
import { createServer as createViteServer } from 'vite';

async function startServer() {
  const app = express();
  const PORT = 3000;

  // In-memory file storage for generated QR code links from files
  // WARNING: This is ephemeral. Memory is cleared on server restart.
  const fileStorage = new Map<string, { buffer: Buffer; originalname: string; mimetype: string }>();
  
  // Set upload limit to 10MB
  const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

  // API Routes
  app.post('/api/upload', upload.single('file'), (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'Nenhum arquivo enviado.' });
      }
      
      const id = crypto.randomUUID();
      fileStorage.set(id, {
        buffer: req.file.buffer,
        originalname: req.file.originalname,
        mimetype: req.file.mimetype,
      });

      // Use APP_URL if injected, otherwise fallback to host header
      const baseUrl = process.env.APP_URL 
        ? process.env.APP_URL 
        : `${req.protocol}://${req.get('host')}`;
      
      // Points to the frontend download page
      const fileUrl = `${baseUrl}/download/${id}`;
      res.json({ url: fileUrl, id });
    } catch (error) {
      console.error("Upload error:", error);
      res.status(500).json({ error: "Erro ao processar arquivo" });
    }
  });

  app.get('/api/file-info/:id', (req, res) => {
    const file = fileStorage.get(req.params.id);
    if (!file) return res.status(404).json({ error: 'Arquivo não encontrado ou expirado.' });

    res.json({
        filename: file.originalname,
        size: file.buffer.length
    });
  });

  app.get('/api/file-download/:id', (req, res) => {
    const file = fileStorage.get(req.params.id);
    if (!file) return res.status(404).send('Arquivo não encontrado ou expirado.');

    res.setHeader('Content-Type', file.mimetype);
    res.setHeader('Content-Disposition', `attachment; filename="${file.originalname}"`);
    res.send(file.buffer);
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    // Production serving of static files
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Servidor rodando na porta ${PORT}`);
  });
}

startServer();
