import { readdir } from 'fs/promises';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const samplesPath = join(__dirname, '..', 'data', 'sample-contracts');

/**
 * Get list of available sample contracts
 * @returns {Promise<array>} List of sample contract info
 */
export async function getSampleContracts() {
    try {
        const files = await readdir(samplesPath);
        return files
            .filter(f => f.endsWith('.txt'))
            .map(filename => {
                // Parse filename to extract metadata
                // Format: TYPE_COUNTRY_description.txt
                const parts = filename.replace('.txt', '').split('_');
                const compliance = parts[0]; // compliant, non_compliant, partial
                const country = parts[1]?.toUpperCase() || 'UNKNOWN';

                return {
                    filename,
                    downloadUrl: `/samples/${filename}`,
                    complianceHint: compliance.replace('-', '_'),
                    targetCountry: country,
                    description: formatDescription(filename)
                };
            });
    } catch (error) {
        console.error('Failed to read samples directory:', error);
        return [];
    }
}

function formatDescription(filename) {
    return filename
        .replace('.txt', '')
        .split('_')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
}
