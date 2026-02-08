import { readFile } from 'fs/promises';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const guidesPath = join(__dirname, '..', 'data', 'country-guides');

/**
 * Get country employment guide by country code
 * @param {string} code - Country code (e.g., 'usa', 'germany', 'uk')
 * @returns {Promise<object|null>} Country guide object or null
 */
export async function getCountryGuide(code) {
    try {
        const filePath = join(guidesPath, `${code.toLowerCase()}.json`);
        const content = await readFile(filePath, 'utf-8');
        return JSON.parse(content);
    } catch (error) {
        console.error(`Failed to load country guide for ${code}:`, error.message);
        return null;
    }
}

/**
 * Get all available country guides
 * @returns {Promise<array>} List of country summaries
 */
export async function getAllCountries() {
    const countries = ['usa', 'germany', 'uk'];
    const results = [];

    for (const code of countries) {
        const guide = await getCountryGuide(code);
        if (guide) {
            results.push({
                code: code.toUpperCase(),
                name: guide.name,
                description: guide.description,
                keyFeatures: guide.keyFeatures || []
            });
        }
    }

    return results;
}
