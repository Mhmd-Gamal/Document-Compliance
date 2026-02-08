# 📋 Document Compliance Analyzer

An AI-powered service that evaluates employment contracts for compliance with country-specific labor regulations using LLM technology.

![Demo](./demo-preview.png)

## 🚀 Features

- **Multi-Country Support**: USA, Germany, and UK employment regulations
- **LLM-Powered Analysis**: Uses Google Gemini API for intelligent document analysis
- **Multiple File Formats**: Supports PDF, DOCX, and TXT uploads
- **Detailed Findings**: Category-by-category compliance breakdown with severity ratings
- **Actionable Recommendations**: Specific guidance for fixing compliance issues
- **Modern UI**: Beautiful glassmorphic design with animated results

## 📁 Project Structure

```
├── backend/
│   ├── src/
│   │   ├── index.js              # Express server
│   │   ├── routes/compliance.js  # API endpoints
│   │   ├── services/
│   │   │   ├── llmService.js     # Gemini API integration
│   │   │   ├── documentParser.js # PDF/DOCX/TXT parsing
│   │   │   ├── countryService.js # Country guides
│   │   │   └── sampleService.js  # Sample contracts
│   │   └── data/
│   │       ├── country-guides/   # Employment regulations (USA, DE, UK)
│   │       └── sample-contracts/ # Test contracts
│   ├── package.json
│   └── .env
├── frontend/
│   ├── index.html
│   ├── styles.css
│   └── app.js
└── README.md
```

## ⚡ Quick Start

### Prerequisites

- Node.js 18+ 
- Groq API key

### 1. Setup Backend

```bash
cd backend
npm install
```

### 2. Configure API Key

Edit `backend/.env`:

```env
GROQ_API_KEY=your-groq-api-key-here
PORT=3000
```

### 3. Start the Server

```bash
npm run dev
```

Server runs at http://localhost:3000

### 4. Open Frontend

Open `frontend/index.html` in your browser (or use Live Server extension).

## 🔌 API Endpoints

| Method | Endpoint             | Description                      |
| ------ | -------------------- | -------------------------------- |
| `POST` | `/api/analyze`       | Upload and analyze a document    |
| `GET`  | `/api/countries`     | List available country guides    |
| `GET`  | `/api/country/:code` | Get specific country regulations |
| `GET`  | `/api/samples`       | List sample contracts            |

### Example: Analyze Document

```bash
curl -X POST http://localhost:3000/api/analyze \
  -F "document=@contract.pdf" \
  -F "countryCode=germany"
```

### Response Structure

```json
{
  "success": true,
  "fileName": "contract.pdf",
  "countryCode": "GERMANY",
  "countryName": "Federal Republic of Germany",
  "analysis": {
    "overallScore": 45,
    "overallStatus": "NON_COMPLIANT",
    "summary": "Contract has significant compliance issues...",
    "findings": [
      {
        "category": "Leave Benefits",
        "requirement": "Minimum 20 days paid annual leave",
        "status": "NON_COMPLIANT",
        "severity": "HIGH",
        "analysis": "Contract specifies only 10 days...",
        "recommendation": "Increase vacation to minimum 20 days"
      }
    ],
    "criticalIssues": ["Vacation below legal minimum"],
    "positiveAspects": ["Proper probation period"]
  }
}
```

## 🌍 Supported Countries

| Country      | Key Regulations Covered                                 |
| ------------ | ------------------------------------------------------- |
| 🇺🇸 USA     | At-will employment, FLSA overtime, ACA health insurance |
| 🇩🇪 Germany | Kündigungsschutz, 20+ vacation days, works council      |
| 🇬🇧 UK      | 28-day holiday, Working Time Regulations, SSP           |

## 🧪 Sample Contracts

The `/backend/src/data/sample-contracts/` folder includes:

1. **compliant_usa_contract.txt** - Fully compliant US employment agreement
2. **non_compliant_germany_contract.txt** - Contains intentional violations (vacation, notice periods, non-compete)
3. **partial_uk_contract.txt** - Mixed compliance with some gaps

## 🛠️ Technology Stack

- **Backend**: Node.js, Express, Google Gemini API
- **Frontend**: Vanilla HTML/CSS/JavaScript
- **Document Parsing**: pdf-parse, mammoth
- **Design**: Glassmorphic dark theme with Inter font

## 📝 How It Works

1. **Upload**: User uploads an employment contract (PDF/DOCX/TXT)
2. **Parse**: Document content is extracted using appropriate parser
3. **Analyze**: LLM receives the contract + country regulations and performs structured analysis
4. **Report**: Results are displayed with compliance scores, detailed findings, and recommendations

### LLM Prompt Strategy

The system uses carefully crafted prompts that:

- Provide clear compliance status definitions
- Request structured JSON output for reliable parsing
- Include specific country regulations as context
- Ask for quoted contract clauses as evidence

## ⚠️ Disclaimer

This is a demonstration tool for educational purposes. The synthetic country guides and analysis results should not be used as actual legal advice. Always consult qualified legal professionals for real employment law matters.

## 📊 Time Invested

Approximately **3 hours** for full implementation including:

- Architecture design and planning
- Backend development with LLM integration
- Synthetic data generation
- Frontend UI development
- Testing and documentation

---

Built for **RemoFirst** Assessment by demonstrating AI-powered legal document analysis.
