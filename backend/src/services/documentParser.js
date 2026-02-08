import pdf from 'pdf-parse/lib/pdf-parse.js';
import mammoth from 'mammoth';

/**
 * Parse document content from various formats
 * @param {Buffer} buffer - File buffer
 * @param {string} mimeType - File MIME type
 * @returns {Promise<string>} Extracted text content
 */
export async function parseDocument(buffer, mimeType) {
    switch (mimeType) {
        case 'application/pdf':
            return parsePDF(buffer);
        case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
            return parseDOCX(buffer);
        case 'text/plain':
            return buffer.toString('utf-8');
        default:
            throw new Error(`Unsupported file type: ${mimeType}`);
    }
}

/**
 * Parse PDF document
 */
async function parsePDF(buffer) {
    try {
        const data = await pdf(buffer);
        return data.text;
    } catch (error) {
        throw new Error(`Failed to parse PDF: ${error.message}`);
    }
}

/**
 * Parse DOCX document
 */
async function parseDOCX(buffer) {
    try {
        const result = await mammoth.extractRawText({ buffer });
        return result.value;
    } catch (error) {
        throw new Error(`Failed to parse DOCX: ${error.message}`);
    }
}
