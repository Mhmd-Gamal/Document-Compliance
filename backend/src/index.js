import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import complianceRoutes from './routes/compliance.js';

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Serve static files for sample contracts download
app.use('/samples', express.static(join(__dirname, 'data', 'sample-contracts')));

// API Routes
app.use('/api', complianceRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Start server
app.listen(PORT, () => {
  console.log(`
╔══════════════════════════════════════════════════════════════╗
║     Document Compliance Service - Running on port ${PORT}       ║
╠══════════════════════════════════════════════════════════════╣
║  API Endpoints:                                              ║
║  • POST /api/analyze     - Analyze document compliance       ║
║  • GET  /api/countries   - List available country guides     ║
║  • GET  /api/country/:id - Get specific country regulations  ║
║  • GET  /api/samples     - Get sample contracts list         ║
╚══════════════════════════════════════════════════════════════╝
  `);
});
