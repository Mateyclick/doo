import type { Express } from "express";
import { createServer, type Server } from "http";
import axios from "axios";
import multer from "multer";
import { storage } from "./storage";
import fs from "fs";
import path from "path";

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
});

export async function registerRoutes(app: Express): Promise<Server> {
  // API routes with '/api' prefix
  app.post('/api/remove-bg', upload.single('image'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: 'No image file provided' });
      }

      // Get API key from environment variables
      const apiKey = process.env.REMOVEBG_API_KEY || process.env.REACT_APP_REMOVEBG_API_KEY;
      
      if (!apiKey) {
        return res.status(500).json({ message: 'Missing Remove.bg API key' });
      }

      // Create form data for Remove.bg API
      const formData = new FormData();
      const blob = new Blob([req.file.buffer], { type: req.file.mimetype });
      formData.append('image_file', blob);

      // Call Remove.bg API
      const response = await axios.post('https://api.remove.bg/v1.0/removebg', 
        formData,
        {
          headers: {
            'X-Api-Key': apiKey
          },
          responseType: 'arraybuffer'
        }
      );

      // Set appropriate headers and send response
      res.set('Content-Type', 'image/png');
      res.send(Buffer.from(response.data));
    } catch (error) {
      console.error('Error removing background:', error);
      res.status(500).json({ 
        message: 'Failed to remove background',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Template SVG files
  // Make sure the templates folder exists
  const templatesDir = path.join(process.cwd(), 'public', 'templates');
  if (!fs.existsSync(templatesDir)) {
    fs.mkdirSync(templatesDir, { recursive: true });
  }

  // Create template SVGs
  createTemplateSVGs(templatesDir);

  const httpServer = createServer(app);

  return httpServer;
}

function createTemplateSVGs(templatesDir: string) {
  // Super Paco Oferta template (red with starburst and Monster can)
  const superPacoOfertaSVG = `
  <svg width="1080" height="1920" viewBox="0 0 1080 1920" xmlns="http://www.w3.org/2000/svg">
    <rect width="1080" height="1920" fill="#FF3B30"/>
    <path d="M540 960 L890 750 L890 1170 Z" fill="#FFD700"/>
    <path d="M540 960 L190 750 L190 1170 Z" fill="#FFD700"/>
    <path d="M540 960 L540 610 L190 610 Z" fill="#FFD700"/>
    <path d="M540 960 L540 1310 L890 1310 Z" fill="#FFD700"/>
    <path d="M540 640 L660 400 L420 400 Z" fill="white"/>
    <path d="M540 1280 L660 1520 L420 1520 Z" fill="white"/>
    <path d="M640 960 L880 840 L880 1080 Z" fill="white"/>
    <path d="M440 960 L200 840 L200 1080 Z" fill="white"/>
    <circle cx="540" cy="960" r="260" fill="white"/>
    <text x="540" y="400" font-family="Inter, sans-serif" font-size="120" font-weight="bold" fill="#FFD700" text-anchor="middle">SUPER PACO</text>
    <text x="540" y="550" font-family="Inter, sans-serif" font-size="200" font-weight="bold" fill="white" text-anchor="middle">OFERTA</text>
    <text x="540" y="1550" font-family="Inter, sans-serif" font-size="100" font-weight="bold" fill="#FFD700" text-anchor="middle">Energizante Monster</text>
  </svg>`;

  // Sale template (amber background with sale text)
  const saleSVG = `
  <svg width="1080" height="1920" viewBox="0 0 1080 1920" xmlns="http://www.w3.org/2000/svg">
    <rect width="1080" height="1920" fill="#FF9500"/>
    <text x="540" y="450" font-family="Inter, sans-serif" font-size="220" font-weight="bold" fill="white" text-anchor="middle">SALE</text>
    <circle cx="540" cy="960" r="450" fill="white"/>
    <text x="540" y="1600" font-family="Inter, sans-serif" font-size="120" font-weight="bold" fill="white" text-anchor="middle">Limited Time Only!</text>
  </svg>`;

  // 50% Off template (blue background with big discount text)
  const fiftyOffSVG = `
  <svg width="1080" height="1920" viewBox="0 0 1080 1920" xmlns="http://www.w3.org/2000/svg">
    <rect width="1080" height="1920" fill="#007AFF"/>
    <text x="540" y="450" font-family="Inter, sans-serif" font-size="200" font-weight="bold" fill="white" text-anchor="middle">50% OFF</text>
    <circle cx="540" cy="960" r="450" fill="white"/>
    <text x="540" y="1600" font-family="Inter, sans-serif" font-size="120" font-weight="bold" fill="white" text-anchor="middle">Big Discount!</text>
  </svg>`;

  // New template (green background with NEW! text)
  const newSVG = `
  <svg width="1080" height="1920" viewBox="0 0 1080 1920" xmlns="http://www.w3.org/2000/svg">
    <rect width="1080" height="1920" fill="#34C759"/>
    <text x="540" y="450" font-family="Inter, sans-serif" font-size="220" font-weight="bold" fill="white" text-anchor="middle">NEW!</text>
    <circle cx="540" cy="960" r="450" fill="white"/>
    <text x="540" y="1600" font-family="Inter, sans-serif" font-size="120" font-weight="bold" fill="white" text-anchor="middle">Just Arrived!</text>
  </svg>`;

  // Write SVG files
  fs.writeFileSync(path.join(templatesDir, 'super-paco-oferta.svg'), superPacoOfertaSVG);
  fs.writeFileSync(path.join(templatesDir, 'sale.svg'), saleSVG);
  fs.writeFileSync(path.join(templatesDir, 'fifty-percent-off.svg'), fiftyOffSVG);
  fs.writeFileSync(path.join(templatesDir, 'new.svg'), newSVG);
}
