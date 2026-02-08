/**
 * Document Compliance Analyzer - Frontend Application
 * Handles file upload, API communication, and results display
 */

const API_BASE = 'http://localhost:3000/api';

// DOM Elements
const elements = {
    countrySelect: document.getElementById('countrySelect'),
    countryInfo: document.getElementById('countryInfo'),
    uploadZone: document.getElementById('uploadZone'),
    fileInput: document.getElementById('fileInput'),
    fileInfo: document.getElementById('fileInfo'),
    removeFile: document.getElementById('removeFile'),
    analyzeBtn: document.getElementById('analyzeBtn'),
    analyzeForm: document.getElementById('analyzeForm'),
    resultsSection: document.getElementById('resultsSection'),
    scoreCircle: document.getElementById('scoreCircle'),
    scoreRing: document.getElementById('scoreRing'),
    scoreNumber: document.getElementById('scoreNumber'),
    overallStatus: document.getElementById('overallStatus'),
    summaryText: document.getElementById('summaryText'),
    findingsList: document.getElementById('findingsList'),
    criticalIssues: document.getElementById('criticalIssues'),
    positiveAspects: document.getElementById('positiveAspects'),
    analyzedFile: document.getElementById('analyzedFile'),
    samplesList: document.getElementById('samplesList'),
    toast: document.getElementById('toast')
};

// State
let selectedFile = null;
let currentAnalysis = null;

// Initialize
document.addEventListener('DOMContentLoaded', init);

async function init() {
    await loadCountries();
    await loadSamples();
    setupEventListeners();
}

// ===== API Functions =====

async function loadCountries() {
    try {
        const response = await fetch(`${API_BASE}/countries`);
        const data = await response.json();

        data.countries.forEach(country => {
            const option = document.createElement('option');
            option.value = country.code.toLowerCase();
            option.textContent = `${getFlag(country.code)} ${country.name}`;
            option.dataset.description = country.description;
            option.dataset.features = JSON.stringify(country.keyFeatures);
            elements.countrySelect.appendChild(option);
        });
    } catch (error) {
        console.error('Failed to load countries:', error);
        showToast('Failed to load country guides. Is the server running?', 'error');
    }
}

async function loadSamples() {
    try {
        const response = await fetch(`${API_BASE}/samples`);
        const data = await response.json();

        elements.samplesList.innerHTML = data.samples.map(sample => `
      <a href="${API_BASE.replace('/api', '')}${sample.downloadUrl}" 
         class="sample-item" 
         download="${sample.filename}">
        📄 ${sample.description}
        <span class="sample-hint ${sample.complianceHint}">${formatHint(sample.complianceHint)}</span>
      </a>
    `).join('');
    } catch (error) {
        console.error('Failed to load samples:', error);
    }
}

async function analyzeDocument() {
    if (!selectedFile || !elements.countrySelect.value) return;

    const formData = new FormData();
    formData.append('document', selectedFile);
    formData.append('countryCode', elements.countrySelect.value);

    setLoading(true);

    try {
        const response = await fetch(`${API_BASE}/analyze`, {
            method: 'POST',
            body: formData
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.details || data.error || 'Analysis failed');
        }

        currentAnalysis = data;
        displayResults(data);
        showToast('Analysis complete!', 'success');

    } catch (error) {
        console.error('Analysis error:', error);
        showToast(error.message, 'error');
    } finally {
        setLoading(false);
    }
}

// ===== Event Listeners =====

function setupEventListeners() {
    // Country selection
    elements.countrySelect.addEventListener('change', handleCountryChange);

    // File upload - click
    elements.uploadZone.addEventListener('click', () => elements.fileInput.click());
    elements.fileInput.addEventListener('change', handleFileSelect);

    // File upload - drag & drop
    elements.uploadZone.addEventListener('dragover', handleDragOver);
    elements.uploadZone.addEventListener('dragleave', handleDragLeave);
    elements.uploadZone.addEventListener('drop', handleDrop);

    // Remove file
    elements.removeFile.addEventListener('click', clearFile);

    // Form submit
    elements.analyzeForm.addEventListener('submit', (e) => {
        e.preventDefault();
        analyzeDocument();
    });

    // Tab filtering
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', handleTabFilter);
    });
}

function handleCountryChange() {
    const selected = elements.countrySelect.selectedOptions[0];

    if (selected.value) {
        const features = JSON.parse(selected.dataset.features || '[]');
        elements.countryInfo.innerHTML = `
      <h4>${selected.textContent}</h4>
      <p>${selected.dataset.description || ''}</p>
      ${features.length ? `
        <ul class="country-features">
          ${features.map(f => `<li>${f}</li>`).join('')}
        </ul>
      ` : ''}
    `;
        elements.countryInfo.classList.remove('hidden');
    } else {
        elements.countryInfo.classList.add('hidden');
    }

    updateAnalyzeButton();
}

function handleFileSelect(e) {
    const file = e.target.files[0];
    if (file) setFile(file);
}

function handleDragOver(e) {
    e.preventDefault();
    elements.uploadZone.classList.add('dragover');
}

function handleDragLeave() {
    elements.uploadZone.classList.remove('dragover');
}

function handleDrop(e) {
    e.preventDefault();
    elements.uploadZone.classList.remove('dragover');

    const file = e.dataTransfer.files[0];
    if (file) setFile(file);
}

function handleTabFilter(e) {
    const filter = e.target.dataset.filter;

    // Update active tab
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    e.target.classList.add('active');

    // Filter findings
    document.querySelectorAll('.finding-item').forEach(item => {
        if (filter === 'all' || item.dataset.status === filter) {
            item.style.display = 'block';
        } else {
            item.style.display = 'none';
        }
    });
}

// ===== UI Functions =====

function setFile(file) {
    const validTypes = [
        'application/pdf',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'text/plain'
    ];

    if (!validTypes.includes(file.type)) {
        showToast('Invalid file type. Please upload PDF, DOCX, or TXT.', 'error');
        return;
    }

    if (file.size > 10 * 1024 * 1024) {
        showToast('File too large. Maximum size is 10MB.', 'error');
        return;
    }

    selectedFile = file;
    elements.fileInfo.querySelector('.file-name').textContent = file.name;
    elements.fileInfo.classList.remove('hidden');
    elements.uploadZone.classList.add('hidden');
    updateAnalyzeButton();
}

function clearFile() {
    selectedFile = null;
    elements.fileInput.value = '';
    elements.fileInfo.classList.add('hidden');
    elements.uploadZone.classList.remove('hidden');
    updateAnalyzeButton();
}

function updateAnalyzeButton() {
    elements.analyzeBtn.disabled = !selectedFile || !elements.countrySelect.value;
}

function setLoading(loading) {
    const btnText = elements.analyzeBtn.querySelector('.btn-text');
    const btnLoading = elements.analyzeBtn.querySelector('.btn-loading');

    if (loading) {
        btnText.classList.add('hidden');
        btnLoading.classList.remove('hidden');
        elements.analyzeBtn.disabled = true;
    } else {
        btnText.classList.remove('hidden');
        btnLoading.classList.add('hidden');
        updateAnalyzeButton();
    }
}

function displayResults(data) {
    const { analysis, fileName, countryName } = data;

    // Show results section
    elements.resultsSection.classList.remove('hidden');
    elements.resultsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });

    // File badge
    elements.analyzedFile.textContent = `${fileName} → ${countryName}`;

    // Animate score
    animateScore(analysis.overallScore, analysis.overallStatus);

    // Status badge
    elements.overallStatus.textContent = formatStatus(analysis.overallStatus);
    elements.overallStatus.className = `status-badge ${analysis.overallStatus}`;

    // Summary
    elements.summaryText.textContent = analysis.summary;

    // Findings list
    elements.findingsList.innerHTML = analysis.findings.map(finding => `
    <div class="finding-item ${finding.status}" data-status="${finding.status}">
      <div class="finding-header">
        <span class="finding-category">${finding.category}</span>
        <span class="finding-severity ${finding.severity}">${finding.severity}</span>
      </div>
      <p class="finding-requirement"><strong>Requirement:</strong> ${finding.requirement}</p>
      <p class="finding-analysis">${finding.analysis}</p>
      ${finding.contractClause && finding.contractClause !== 'Not found' ? `
        <div class="finding-clause">
          <strong>Contract says:</strong> "${truncate(finding.contractClause, 200)}"
        </div>
      ` : ''}
      ${finding.recommendation && finding.status !== 'COMPLIANT' ? `
        <div class="finding-recommendation">
          <strong>💡 Recommendation:</strong> ${finding.recommendation}
        </div>
      ` : ''}
    </div>
  `).join('');

    // Critical issues
    elements.criticalIssues.innerHTML = (analysis.criticalIssues || []).length
        ? analysis.criticalIssues.map(issue => `<li>⚠️ ${issue}</li>`).join('')
        : '<li style="color: var(--success)">No critical issues found</li>';

    // Positive aspects
    elements.positiveAspects.innerHTML = (analysis.positiveAspects || []).length
        ? analysis.positiveAspects.map(aspect => `<li>✓ ${aspect}</li>`).join('')
        : '<li style="color: var(--text-muted)">No significant positive aspects noted</li>';
}

function animateScore(score, status) {
    // Set color based on status
    const colors = {
        COMPLIANT: '#10b981',
        PARTIALLY_COMPLIANT: '#f59e0b',
        NON_COMPLIANT: '#ef4444'
    };

    const color = colors[status] || colors.PARTIALLY_COMPLIANT;
    elements.scoreRing.style.stroke = color;
    elements.scoreNumber.style.color = color;

    // Animate number
    let current = 0;
    const duration = 1500;
    const step = score / (duration / 16);

    const animate = () => {
        current = Math.min(current + step, score);
        elements.scoreNumber.textContent = Math.round(current);

        // Animate ring
        const circumference = 2 * Math.PI * 70; // r=70
        const offset = circumference - (current / 100) * circumference;
        elements.scoreRing.style.strokeDashoffset = offset;

        if (current < score) {
            requestAnimationFrame(animate);
        }
    };

    requestAnimationFrame(animate);
}

function showToast(message, type = 'info') {
    elements.toast.textContent = message;
    elements.toast.className = `toast ${type} show`;

    setTimeout(() => {
        elements.toast.classList.remove('show');
    }, 4000);
}

// ===== Utility Functions =====

function getFlag(code) {
    const flags = {
        USA: '🇺🇸',
        GERMANY: '🇩🇪',
        UK: '🇬🇧'
    };
    return flags[code] || '🌍';
}

function formatStatus(status) {
    return status.replace(/_/g, ' ');
}

function formatHint(hint) {
    const labels = {
        compliant: '✓ Compliant',
        non_compliant: '✗ Non-Compliant',
        partial: '⚠ Partial'
    };
    return labels[hint] || hint;
}

function truncate(str, maxLength) {
    if (!str) return '';
    return str.length > maxLength ? str.substring(0, maxLength) + '...' : str;
}
