const API_URL = '/api/quiz';
const USER_KEY_STORAGE = 'quizUserKey';

function getUserKey() {
    return localStorage.getItem(USER_KEY_STORAGE) || '';
}

function saveUserKey() {
    const val = document.getElementById('userKeyInput').value.trim();
    if (!val) {
        alert('Bitte einen User-Key einfügen.');
        return;
    }
    localStorage.setItem(USER_KEY_STORAGE, val);
    updateUserKeyState();
    loadData();
}

function clearUserKey() {
    localStorage.removeItem(USER_KEY_STORAGE);
    document.getElementById('userKeyInput').value = '';
    updateUserKeyState();
}

function updateUserKeyState() {
    const hasKey = !!getUserKey();
    const badge = document.getElementById('userKeyStatus');
    if (badge) {
        badge.className = 'badge ' + (hasKey ? 'bg-success' : 'bg-secondary');
        badge.textContent = hasKey ? 'Key gesetzt' : 'Kein Schlüssel gesetzt';
    }
}

function ensureUserKey() {
    const key = getUserKey();
    if (!key) {
        alert('Bitte zuerst einen User-Key speichern.');
        return null;
    }
    return key;
}

// Kategorie-Icons Mapping
const categoryIcons = {
    'IT-Systeme': 'pc-display',
    'Netzwerktechnik': 'wifi',
    'Betriebssysteme': 'terminal',
    'Programmierung': 'code-slash',
    'Datenbanken': 'database',
    'IT-Sicherheit': 'shield-lock',
    'Software-Engineering': 'gear',
    'Wirtschaft & Recht': 'briefcase',
    'Projektmanagement': 'kanban',
    'Elektrotechnik': 'lightning-charge'
};

// Kategorie-Farben Mapping
const categoryColors = {
    'IT-Systeme': 'primary',
    'Netzwerktechnik': 'info',
    'Betriebssysteme': 'success',
    'Programmierung': 'danger',
    'Datenbanken': 'warning',
    'IT-Sicherheit': 'dark',
    'Software-Engineering': 'secondary',
    'Wirtschaft & Recht': 'primary',
    'Projektmanagement': 'info',
    'Elektrotechnik': 'warning'
};

let allQuestions = [];
let categoryStats = {};

// Lade Daten beim Start
window.addEventListener('load', async function() {
    const input = document.getElementById('userKeyInput');
    if (input) {
        input.value = getUserKey();
    }
    updateUserKeyState();
    await loadData();
});

// Lade alle Daten
async function loadData() {
    try {
        const key = ensureUserKey();
        if (!key) return;

        // Lade Statistiken
        const statsResponse = await fetch(`${API_URL}/statistics`, {
            headers: { 'X-API-Key': key }
        });
        const stats = await statsResponse.json();
        
        // Lade alle Fragen
        const questionsResponse = await fetch(API_URL, {
            headers: { 'X-API-Key': key }
        });
        allQuestions = await questionsResponse.json();
        
        // Update UI
        updateStatistics(stats);
        calculateCategoryStats();
        renderCategories();
        
    } catch (error) {
        console.error('Fehler beim Laden der Daten:', error);
    }
}

// Update Statistiken
function updateStatistics(stats) {
    document.getElementById('totalQuestions').textContent = stats.totalQuestions;
    document.getElementById('mcQuestions').textContent = stats.multipleChoiceQuestions;
    document.getElementById('otherQuestions').textContent = stats.textQuestions + stats.matchingQuestions;
    
    // Zähle verwendete Kategorien
    const uniqueCategories = new Set(allQuestions.map(q => q.category));
    document.getElementById('totalCategories').textContent = uniqueCategories.size;
}

// Berechne Statistiken pro Kategorie
function calculateCategoryStats() {
    categoryStats = {};
    
    allQuestions.forEach(question => {
        const category = question.category;
        
        if (!categoryStats[category]) {
            categoryStats[category] = {
                total: 0,
                leicht: 0,
                mittel: 0,
                schwer: 0,
                multipleChoice: 0,
                text: 0,
                matching: 0
            };
        }
        
        categoryStats[category].total++;
        
        // Schwierigkeit
        if (question.difficulty === 'leicht') categoryStats[category].leicht++;
        else if (question.difficulty === 'mittel') categoryStats[category].mittel++;
        else if (question.difficulty === 'schwer') categoryStats[category].schwer++;
        
        // Typ
        if (question.questionType === 'multiple-choice') categoryStats[category].multipleChoice++;
        else if (question.questionType === 'text') categoryStats[category].text++;
        else if (question.questionType === 'matching') categoryStats[category].matching++;
    });
}

// Rendere Kategorien
function renderCategories() {
    const container = document.getElementById('categoriesContainer');
    const emptyState = document.getElementById('emptyState');
    
    if (Object.keys(categoryStats).length === 0) {
        container.style.display = 'none';
        emptyState.style.display = 'block';
        return;
    }
    
    container.style.display = 'flex';
    emptyState.style.display = 'none';
    container.innerHTML = '';
    
    // Sortiere Kategorien nach Anzahl der Fragen (absteigend)
    const sortedCategories = Object.entries(categoryStats)
        .sort((a, b) => b[1].total - a[1].total);
    
    sortedCategories.forEach(([category, stats]) => {
        const icon = categoryIcons[category] || 'folder';
        const color = categoryColors[category] || 'secondary';
        
        const card = document.createElement('div');
        card.className = 'col-md-6 col-lg-4';
        card.innerHTML = `
            <div class="card category-card h-100">
                <div class="card-body">
                    <div class="d-flex justify-content-between align-items-start mb-3">
                        <div>
                            <i class="bi bi-${icon} fs-2 text-${color}"></i>
                        </div>
                        <span class="badge bg-${color} rounded-pill">${stats.total} ${stats.total === 1 ? 'Frage' : 'Fragen'}</span>
                    </div>
                    
                    <h5 class="card-title">${category}</h5>
                    
                    <div class="mb-3">
                        <small class="text-muted d-block mb-1">Schwierigkeit:</small>
                        <div class="d-flex gap-2 flex-wrap">
                            ${stats.leicht > 0 ? `<span class="badge bg-success-subtle text-success"><i class="bi bi-circle-fill"></i> Leicht: ${stats.leicht}</span>` : ''}
                            ${stats.mittel > 0 ? `<span class="badge bg-warning-subtle text-warning"><i class="bi bi-circle-fill"></i> Mittel: ${stats.mittel}</span>` : ''}
                            ${stats.schwer > 0 ? `<span class="badge bg-danger-subtle text-danger"><i class="bi bi-circle-fill"></i> Schwer: ${stats.schwer}</span>` : ''}
                        </div>
                    </div>
                    
                    <div class="mb-3">
                        <small class="text-muted d-block mb-1">Fragetypen:</small>
                        <div class="d-flex gap-2 flex-wrap">
                            ${stats.multipleChoice > 0 ? `<span class="badge bg-primary-subtle text-primary"><i class="bi bi-check-square"></i> MC: ${stats.multipleChoice}</span>` : ''}
                            ${stats.text > 0 ? `<span class="badge bg-info-subtle text-info"><i class="bi bi-pencil"></i> Text: ${stats.text}</span>` : ''}
                            ${stats.matching > 0 ? `<span class="badge bg-secondary-subtle text-secondary"><i class="bi bi-arrow-left-right"></i> Zuordnung: ${stats.matching}</span>` : ''}
                        </div>
                    </div>
                    
                    <div class="d-grid gap-2">
                        <a href="quiz.html?category=${encodeURIComponent(category)}" class="btn btn-${color}">
                            <i class="bi bi-play-circle-fill me-1"></i>Quiz starten
                        </a>
                        <button class="btn btn-outline-${color} btn-sm" onclick="showCategoryDetails('${category}')">
                            <i class="bi bi-eye-fill me-1"></i>Details ansehen
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        container.appendChild(card);
    });
}

// Zeige Details einer Kategorie
function showCategoryDetails(category) {
    const questions = allQuestions.filter(q => q.category === category);
    
    const modal = document.createElement('div');
    modal.className = 'modal fade';
    modal.innerHTML = `
        <div class="modal-dialog modal-lg modal-dialog-scrollable">
            <div class="modal-content">
                <div class="modal-header">
                    <h5 class="modal-title">
                        <i class="bi bi-${categoryIcons[category] || 'folder'}"></i> ${category}
                    </h5>
                    <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                </div>
                <div class="modal-body">
                    <h6 class="mb-3">Alle Fragen in dieser Kategorie:</h6>
                    <div class="list-group">
                        ${questions.map((q, index) => `
                            <div class="list-group-item">
                                <div class="d-flex justify-content-between align-items-start">
                                    <div class="flex-grow-1">
                                        <strong>${index + 1}. ${q.question}</strong>
                                        <div class="mt-2">
                                            <span class="badge bg-${q.difficulty === 'leicht' ? 'success' : q.difficulty === 'mittel' ? 'warning' : 'danger'} me-1">
                                                ${q.difficulty}
                                            </span>
                                            <span class="badge bg-info">
                                                ${q.questionType === 'multiple-choice' ? 'Multiple Choice' : 
                                                  q.questionType === 'text' ? 'Texteingabe' : 'Zuordnung'}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
                <div class="modal-footer">
                    <a href="quiz.html?category=${encodeURIComponent(category)}" class="btn btn-primary">
                        <i class="bi bi-play-circle-fill me-1"></i>Quiz mit dieser Kategorie starten
                    </a>
                    <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Schließen</button>
                </div>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    const bsModal = new bootstrap.Modal(modal);
    bsModal.show();
    
    modal.addEventListener('hidden.bs.modal', function() {
        modal.remove();
    });
}
