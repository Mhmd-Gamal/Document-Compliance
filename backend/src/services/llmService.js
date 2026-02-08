import Groq from 'groq-sdk';
import dotenv from 'dotenv';

dotenv.config();

const groq = new Groq({
    apiKey: process.env.GROQ_API_KEY
});

// Retry configuration
const RETRY_CONFIG = {
    maxRetries: 3,
    baseDelayMs: 2000,
    maxDelayMs: 60000,
    backoffMultiplier: 2
};

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

function isRateLimitError(error) {
    const message = error.message || '';
    return message.includes('429') ||
        message.includes('Too Many Requests') ||
        message.includes('quota') ||
        message.includes('rate limit') ||
        message.includes('Rate limit');
}

function extractRetryDelay(error) {
    const message = error.message || '';
    const match = message.match(/retry\s+in\s+([\d.]+)s/i);
    if (match) {
        return Math.ceil(parseFloat(match[1]) * 1000);
    }
    return null;
}

async function withRetry(fn, config = RETRY_CONFIG) {
    let lastError;

    for (let attempt = 0; attempt <= config.maxRetries; attempt++) {
        try {
            return await fn();
        } catch (error) {
            lastError = error;

            if (!isRateLimitError(error)) {
                throw error;
            }

            if (attempt >= config.maxRetries) {
                console.error(`Max retries (${config.maxRetries}) exceeded for rate limit error`);
                throw error;
            }

            let delay = config.baseDelayMs * Math.pow(config.backoffMultiplier, attempt);
            const serverDelay = extractRetryDelay(error);
            if (serverDelay) {
                delay = Math.max(delay, serverDelay);
            }
            delay = Math.min(delay, config.maxDelayMs);
            const jitter = delay * 0.1 * (Math.random() * 2 - 1);
            delay = Math.round(delay + jitter);

            console.log(`Rate limit hit. Retry attempt ${attempt + 1}/${config.maxRetries} after ${delay}ms...`);
            await sleep(delay);
        }
    }

    throw lastError;
}

/**
 * Analyze document compliance against country regulations using LLM
 * @param {string} documentText - The extracted document text
 * @param {object} countryGuide - The country's employment regulations
 * @returns {Promise<object>} Compliance analysis results
 */
export async function analyzeCompliance(documentText, countryGuide) {
    const systemPrompt = buildSystemPrompt();
    const userPrompt = buildUserPrompt(documentText, countryGuide);

    try {
        const result = await withRetry(async () => {
            const chatCompletion = await groq.chat.completions.create({
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: userPrompt }
                ],
                model: 'llama-3.3-70b-versatile',  // Free, powerful model on Groq
                temperature: 0.1,
                response_format: { type: 'json_object' }
            });

            return chatCompletion.choices[0]?.message?.content;
        });

        const parsedResult = JSON.parse(result);
        return parsedResult;

    } catch (error) {
        console.error('LLM Analysis Error:', error);

        if (error.message?.includes('API_KEY') || error.message?.includes('api_key')) {
            throw new Error('Invalid Groq API key. Please check your .env configuration.');
        }

        throw new Error(`LLM analysis failed: ${error.message}`);
    }
}

/**
 * Build the system prompt for compliance analysis
 */
function buildSystemPrompt() {
    return `You are an expert legal compliance analyst specializing in international employment law. 
Your task is to analyze employment contracts and evaluate their compliance with country-specific labor regulations.

ANALYSIS METHODOLOGY:
1. Read the employment contract thoroughly
2. Compare each clause against the provided country regulations
3. Identify specific compliance issues with precise references
4. Provide actionable recommendations for remediation

COMPLIANCE STATUS DEFINITIONS:
- COMPLIANT: The contract clause meets or exceeds the legal requirement
- NON_COMPLIANT: The contract violates the regulation or falls short of requirements
- PARTIALLY_COMPLIANT: The contract addresses the requirement but has minor gaps
- NOT_ADDRESSED: The contract does not mention this aspect (may or may not be required)

OUTPUT FORMAT:
You MUST respond with a valid JSON object following this exact structure:
{
  "overallScore": <number 0-100>,
  "overallStatus": "<COMPLIANT|PARTIALLY_COMPLIANT|NON_COMPLIANT>",
  "summary": "<2-3 sentence executive summary>",
  "findings": [
    {
      "category": "<regulation category>",
      "requirement": "<what the law requires>",
      "status": "<COMPLIANT|NON_COMPLIANT|PARTIALLY_COMPLIANT|NOT_ADDRESSED>",
      "contractClause": "<relevant text from contract or 'Not found'>",
      "analysis": "<detailed explanation>",
      "severity": "<HIGH|MEDIUM|LOW>",
      "recommendation": "<specific action to fix if non-compliant>"
    }
  ],
  "criticalIssues": ["<list of most severe violations>"],
  "positiveAspects": ["<list of well-handled compliance areas>"]
}`;
}

/**
 * Build the user prompt with document and regulations
 */
function buildUserPrompt(documentText, countryGuide) {
    return `Please analyze the following employment contract for compliance with ${countryGuide.name} employment regulations.

=== COUNTRY REGULATIONS: ${countryGuide.name} ===
${JSON.stringify(countryGuide.regulations, null, 2)}

=== EMPLOYMENT CONTRACT TO ANALYZE ===
${documentText}

=== INSTRUCTIONS ===
1. Analyze the contract against EACH regulation category provided
2. Quote specific contract clauses when referencing findings
3. Be precise about what is compliant vs non-compliant
4. Provide the overall compliance score as a percentage (0-100)
5. Focus on legally significant issues, not formatting

Respond with the JSON analysis object as specified.`;
}
