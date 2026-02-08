import express from 'express';
import multer from 'multer';
import { parseDocument } from '../services/documentParser.js';
import { analyzeCompliance } from '../services/llmService.js';
import { getCountryGuide, getAllCountries } from '../services/countryService.js';
import { getSampleContracts } from '../services/sampleService.js';

const router = express.Router();

// Configure multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({
    storage,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
    fileFilter: (req, file, cb) => {
        const allowedTypes = [
            'application/pdf',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'text/plain'
        ];
        if (allowedTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Invalid file type. Allowed: PDF, DOCX, TXT'));
        }
    }
});

/**
 * POST /api/analyze
 * Analyze a document for compliance with country regulations
 */
router.post('/analyze', upload.single('document'), async (req, res) => {
    try {
        const { countryCode } = req.body;

        if (!req.file) {
            return res.status(400).json({ error: 'No document uploaded' });
        }

        if (!countryCode) {
            return res.status(400).json({ error: 'Country code is required' });
        }

        // Get country regulations
        const countryGuide = await getCountryGuide(countryCode);
        if (!countryGuide) {
            return res.status(404).json({ error: `Country guide not found for: ${countryCode}` });
        }

        // Parse the uploaded document
        console.log(`📄 Parsing document: ${req.file.originalname}`);
        const documentText = await parseDocument(req.file.buffer, req.file.mimetype);

        // Analyze compliance using LLM
        console.log(`🔍 Analyzing compliance against ${countryCode.toUpperCase()} regulations...`);
        const analysis = await analyzeCompliance(documentText, countryGuide);

        res.json({
            success: true,
            fileName: req.file.originalname,
            countryCode: countryCode.toUpperCase(),
            countryName: countryGuide.name,
            analysis
        });

    } catch (error) {
        console.error('Analysis error:', error);
        res.status(500).json({
            error: 'Failed to analyze document',
            details: error.message
        });
    }
});

/**
 * GET /api/countries
 * Get list of all available country guides
 */
router.get('/countries', async (req, res) => {
    try {
        const countries = await getAllCountries();
        res.json({ countries });
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch countries' });
    }
});

/**
 * GET /api/country/:code
 * Get specific country regulations
 */
router.get('/country/:code', async (req, res) => {
    try {
        const guide = await getCountryGuide(req.params.code);
        if (!guide) {
            return res.status(404).json({ error: 'Country not found' });
        }
        res.json(guide);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch country guide' });
    }
});

/**
 * GET /api/samples
 * Get list of sample contracts for testing
 */
router.get('/samples', async (req, res) => {
    try {
        const samples = await getSampleContracts();
        res.json({ samples });
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch samples' });
    }
});

export default router;
