const API_URL = '/api/quiz';
const ADMIN_KEY_STORAGE = 'quizAdminKey';
const USER_KEY_STORAGE = 'quizUserKey';

function getAdminKey() {
    return localStorage.getItem(ADMIN_KEY_STORAGE) || '';
}

function getUserKey() {
    return localStorage.getItem(USER_KEY_STORAGE) || '';
}

function saveAdminKey() {
    const key = document.getElementById('adminKeyInput').value.trim();
    if (!key) {
        showMessage('Bitte einen Admin-Key einfügen.', 'error');
        return;
    }
    localStorage.setItem(ADMIN_KEY_STORAGE, key);
    updateAdminKeyState();
    showMessage('Admin-Key gespeichert. ✅', 'success');
}

function clearAdminKey() {
    localStorage.removeItem(ADMIN_KEY_STORAGE);
    document.getElementById('adminKeyInput').value = '';
    updateAdminKeyState();
    showMessage('Admin-Key entfernt.', 'info');
}

function saveUserKey() {
    const key = document.getElementById('userKeyInput').value.trim();
    if (!key) {
        showMessage('Bitte einen User-Key einfügen.', 'error');
        return;
    }
    localStorage.setItem(USER_KEY_STORAGE, key);
    updateUserKeyState();
    showMessage('User-Key gespeichert. ✅', 'success');
}

function clearUserKey() {
    localStorage.removeItem(USER_KEY_STORAGE);
    document.getElementById('userKeyInput').value = '';
    updateUserKeyState();
    showMessage('User-Key entfernt.', 'info');
}

function updateAdminKeyState() {
    const hasKey = !!getAdminKey();
    const badge = document.getElementById('adminKeyStatus');
    if (badge) {
        badge.className = 'badge ' + (hasKey ? 'bg-success' : 'bg-secondary');
        badge.textContent = hasKey ? 'Key gesetzt' : 'Kein Schlüssel gesetzt';
    }

    // Disable submit button if no key is present
    const submitButton = document.getElementById('submitButton');
    if (submitButton && !hasKey) {
        submitButton.disabled = true;
    }
}

function updateUserKeyState() {
    const hasKey = !!getUserKey();
    const badge = document.getElementById('userKeyStatus');
    if (badge) {
        badge.className = 'badge ' + (hasKey ? 'bg-success' : 'bg-secondary');
        badge.textContent = hasKey ? 'Key gesetzt' : 'Kein Schlüssel gesetzt';
    }
}

function ensureReadKey() {
    const adminKey = getAdminKey();
    if (adminKey) return adminKey;
    const userKey = getUserKey();
    if (userKey) return userKey;
    showMessage('Bitte einen User- oder Admin-Key speichern.', 'error');
    return null;
}

function ensureAdminKey() {
    const key = getAdminKey();
    if (!key) {
        showMessage('Bitte zuerst den Admin-Key speichern (oben im Formular).', 'error');
        return null;
    }
    return key;
}

// Schrittweise Formularanzeige
function initializeFormSteps() {
    const questionInput = document.getElementById('question');
    const questionTypeSelect = document.getElementById('questionType');
    const categorySelect = document.getElementById('category');
    const difficultySelect = document.getElementById('difficulty');
    
    // Zeige Fragetyp wenn Frage eingegeben
    questionInput.addEventListener('input', function() {
        if (this.value.trim().length > 0) {
            showStep('step-questionType');
        } else {
            hideStep('step-questionType');
            hideStep('step-metadata');
            hideStep('step-buttons');
        }
    });
    
    // Zeige Kategorie/Schwierigkeit wenn Fragetyp gewählt
    questionTypeSelect.addEventListener('change', function() {
        if (this.value) {
            showStep('step-metadata');
        } else {
            hideStep('step-metadata');
            hideStep('step-buttons');
        }
    });
    
    // Zeige Buttons wenn Kategorie und Schwierigkeit gewählt
    function checkMetadata() {
        if (categorySelect.value && difficultySelect.value) {
            showStep('step-buttons');
        } else {
            hideStep('step-buttons');
        }
    }
    
    categorySelect.addEventListener('change', checkMetadata);
    difficultySelect.addEventListener('change', checkMetadata);
    
    // Validiere Formular für Button-Aktivierung
    setupFormValidation();
}

function setupFormValidation() {
    const questionInput = document.getElementById('question');
    const questionTypeSelect = document.getElementById('questionType');
    const categorySelect = document.getElementById('category');
    const difficultySelect = document.getElementById('difficulty');
    const submitButton = document.getElementById('submitButton');
    
    function validateForm() {
        const question = questionInput.value.trim();
        const questionType = questionTypeSelect.value;
        const category = categorySelect.value;
        const difficulty = difficultySelect.value;
        
        // Basisvalidierung
        if (!question || !questionType || !category || !difficulty) {
            submitButton.disabled = true;
            return;
        }
        
        // Typspezifische Validierung
        let typeValid = false;
        
        if (questionType === 'multiple-choice') {
            typeValid = validateMultipleChoice();
        } else if (questionType === 'text') {
            typeValid = validateTextAnswer();
        } else if (questionType === 'matching') {
            typeValid = validateMatching();
        }
        
        submitButton.disabled = !typeValid || !getAdminKey();
    }
    
    function validateMultipleChoice() {
        const answerCount = parseInt(document.getElementById('answerCount').value) || 5;
        
        // Prüfe nur ob Felder existieren und ausgefüllt sind
        for (let i = 0; i < answerCount; i++) {
            const answerElement = document.getElementById(`answer${i}`);
            if (!answerElement || !answerElement.value.trim()) {
                return false;
            }
        }
        
        return document.querySelectorAll('input[name="correct"]:checked').length > 0;
    }
    
    function validateTextAnswer() {
        const textAnswer = document.getElementById('textAnswer');
        return textAnswer && textAnswer.value.trim().length > 0;
    }
    
    function validateMatching() {
        const itemCount = parseInt(document.getElementById('itemCount').value) || 4;
        const categoryCount = parseInt(document.getElementById('categoryCount').value) || 3;
        
        // Prüfe nur ob Felder ausgefüllt sind
        for (let i = 0; i < itemCount; i++) {
            const itemElement = document.getElementById(`leftItem${i}`);
            if (!itemElement || !itemElement.value.trim()) return false;
        }
        
        for (let i = 0; i < categoryCount; i++) {
            const catElement = document.getElementById(`rightItem${i}`);
            if (!catElement || !catElement.value.trim()) return false;
        }
        
        // Prüfe ob mindestens eine Checkbox angeklickt ist
        return document.querySelectorAll('#mappingsContainer input[type="checkbox"]:checked').length > 0;
    }
    
    // Event Listener für alle Felder
    questionInput.addEventListener('input', validateForm);
    questionTypeSelect.addEventListener('change', validateForm);
    categorySelect.addEventListener('change', validateForm);
    difficultySelect.addEventListener('change', validateForm);
    
    // Delegierter Event Listener für dynamische Felder
    document.getElementById('quizForm').addEventListener('input', function(e) {
        if (e.target.matches('input[type="text"], textarea, input[type="checkbox"]')) {
            validateForm();
        }
    });
    
    document.getElementById('quizForm').addEventListener('change', function(e) {
        if (e.target.matches('input[type="checkbox"], input[type="number"]')) {
            validateForm();
        }
    });
}

function showStep(stepId) {
    const step = document.getElementById(stepId);
    if (step && !step.classList.contains('visible')) {
        step.classList.add('visible');
    }
}

function hideStep(stepId) {
    const step = document.getElementById(stepId);
    if (step) {
        step.classList.remove('visible');
    }
}

// Fragetyp wechseln
function toggleAnswerType() {
    const questionType = document.getElementById('questionType').value;
    const multipleChoiceSection = document.getElementById('multipleChoiceSection');
    const textAnswerSection = document.getElementById('textAnswerSection');
    const matchingSection = document.getElementById('matchingSection');
    
    if (questionType === 'multiple-choice') {
        multipleChoiceSection.style.display = 'block';
        textAnswerSection.style.display = 'none';
        matchingSection.style.display = 'none';
        document.getElementById('textAnswer').required = false;
        // Antwortfelder initialisieren
        updateAnswerFields();
    } else if (questionType === 'text') {
        multipleChoiceSection.style.display = 'none';
        textAnswerSection.style.display = 'block';
        matchingSection.style.display = 'none';
        document.getElementById('textAnswer').required = true;
    } else if (questionType === 'matching') {
        multipleChoiceSection.style.display = 'none';
        textAnswerSection.style.display = 'none';
        matchingSection.style.display = 'block';
        document.getElementById('textAnswer').required = false;
        // Zuordnungsfelder initialisieren
        updateMatchingFields();
    } else {
        multipleChoiceSection.style.display = 'none';
        textAnswerSection.style.display = 'none';
        matchingSection.style.display = 'none';
    }
}

// Dynamisch Antwortfelder erstellen
function updateAnswerFields() {
    const count = parseInt(document.getElementById('answerCount').value) || 5;
    const container = document.getElementById('answersContainer');
    
    // Alte Antwortfelder entfernen
    container.innerHTML = '';
    
    // Neue Antwortfelder erstellen
    for (let i = 0; i < count; i++) {
        const answerItem = document.createElement('div');
        answerItem.className = 'answer-item';
        answerItem.innerHTML = `
            <input type="checkbox" class="form-check-input" name="correct" value="${i}">
            <input type="text" class="form-control" id="answer${i}" placeholder="Antwort ${i + 1}" required>
        `;
        container.appendChild(answerItem);
    }
}

// Dynamisch Zuordnungsfelder erstellen
function updateMatchingFields() {
    const itemCount = parseInt(document.getElementById('itemCount').value) || 4;
    const categoryCount = parseInt(document.getElementById('categoryCount').value) || 3;
    
    const leftContainer = document.getElementById('leftItemsContainer');
    const rightContainer = document.getElementById('rightItemsContainer');
    const mappingsContainer = document.getElementById('mappingsContainer');
    
    // Linke Items erstellen
    leftContainer.innerHTML = '';
    for (let i = 0; i < itemCount; i++) {
        const itemDiv = document.createElement('div');
        itemDiv.className = 'mb-2';
        itemDiv.innerHTML = `
            <input type="text" class="form-control" id="leftItem${i}" placeholder="Item ${i + 1}" required>
        `;
        leftContainer.appendChild(itemDiv);
    }
    
    // Rechte Items (Kategorien) erstellen
    rightContainer.innerHTML = '';
    for (let i = 0; i < categoryCount; i++) {
        const categoryDiv = document.createElement('div');
        categoryDiv.className = 'mb-2';
        categoryDiv.innerHTML = `
            <input type="text" class="form-control" id="rightItem${i}" placeholder="Kategorie ${i + 1}" required>
        `;
        rightContainer.appendChild(categoryDiv);
    }
    
    // Zuordnungs-Checkboxen erstellen
    mappingsContainer.innerHTML = '';
    for (let catIndex = 0; catIndex < categoryCount; catIndex++) {
        const mappingCard = document.createElement('div');
        mappingCard.className = 'card mb-2';
        mappingCard.innerHTML = `
            <div class="card-body py-2">
                <strong>Kategorie ${catIndex + 1}:</strong>
                <div class="mt-2" id="mappingCheckboxes${catIndex}">
                    ${Array.from({length: itemCount}, (_, itemIndex) => `
                        <div class="form-check form-check-inline">
                            <input class="form-check-input" type="checkbox" id="mapping_${catIndex}_${itemIndex}" value="${itemIndex}">
                            <label class="form-check-label" for="mapping_${catIndex}_${itemIndex}">Item ${itemIndex + 1}</label>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
        mappingsContainer.appendChild(mappingCard);
    }
}

// Formular Submit
document.getElementById('quizForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    // Bootstrap Validierung aktivieren
    const form = e.target;
    if (!form.checkValidity()) {
        e.stopPropagation();
        form.classList.add('was-validated');
        return;
    }

    const question = document.getElementById('question').value;
    const questionType = document.getElementById('questionType').value;
    const category = document.getElementById('category').value;
    const difficulty = document.getElementById('difficulty').value;

    let data = {
        question,
        questionType,
        category,
        difficulty
    };

    if (questionType === 'multiple-choice') {
        const answerCount = parseInt(document.getElementById('answerCount').value) || 5;
        const answers = [];
        for (let i = 0; i < answerCount; i++) {
            const answerElement = document.getElementById(`answer${i}`);
            if (answerElement && answerElement.value.trim()) {
                answers.push(answerElement.value);
            }
        }
        
        // Sammle alle angekreuzten richtigen Antworten
        const correctAnswerIndices = [];
        const checkedBoxes = document.querySelectorAll('input[name="correct"]:checked');
        checkedBoxes.forEach(checkbox => {
            correctAnswerIndices.push(parseInt(checkbox.value));
        });
        
        data.answers = answers;
        data.correctAnswerIndices = correctAnswerIndices;
    } else if (questionType === 'text') {
        data.textAnswer = document.getElementById('textAnswer').value;
    } else if (questionType === 'matching') {
        const itemCount = parseInt(document.getElementById('itemCount').value) || 4;
        const categoryCount = parseInt(document.getElementById('categoryCount').value) || 3;
        
        // Sammle linke Items
        const leftItems = [];
        for (let i = 0; i < itemCount; i++) {
            const itemElement = document.getElementById(`leftItem${i}`);
            if (itemElement && itemElement.value.trim()) {
                leftItems.push(itemElement.value);
            }
        }
        
        // Sammle rechte Items (Kategorien)
        const rightItems = [];
        for (let i = 0; i < categoryCount; i++) {
            const catElement = document.getElementById(`rightItem${i}`);
            if (catElement && catElement.value.trim()) {
                rightItems.push(catElement.value);
            }
        }
        
        // Sammle Zuordnungen
        const correctMappings = [];
        for (let catIndex = 0; catIndex < categoryCount; catIndex++) {
            const selectedItems = [];
            for (let itemIndex = 0; itemIndex < itemCount; itemIndex++) {
                const checkbox = document.getElementById(`mapping_${catIndex}_${itemIndex}`);
                if (checkbox && checkbox.checked) {
                    selectedItems.push(itemIndex);
                }
            }
            if (selectedItems.length > 0) {
                correctMappings.push({
                    categoryIndex: catIndex,
                    itemIndices: selectedItems
                });
            }
        }
        
        data.leftItems = leftItems;
        data.rightItems = rightItems;
        data.correctMappings = correctMappings;
    }

    try {
        const adminKey = ensureAdminKey();
        if (!adminKey) return;

        let url = API_URL;
        let method = 'POST';
        
        // Wenn wir im Edit-Modus sind, verwende PUT
        if (editingQuestionId) {
            url = `${API_URL}/${editingQuestionId}`;
            method = 'PUT';
        }
        
        const response = await fetch(url, {
            method: method,
            headers: {
                'Content-Type': 'application/json',
                'X-API-Key': adminKey
            },
            body: JSON.stringify(data)
        });

        if (response.ok) {
            const message = editingQuestionId ? 'Frage erfolgreich aktualisiert! ✅' : 'Frage erfolgreich gespeichert! ✅';
            showMessage(message, 'success');
            resetForm();
            loadQuestions();
        } else {
            // Zeige Backend-Fehlermeldung
            try {
                const errorData = await response.json();
                showMessage(errorData.error || 'Fehler beim Speichern der Frage! ❌', 'error');
            } catch {
                showMessage('Fehler beim Speichern der Frage! ❌', 'error');
            }
        }
    } catch (error) {
        showMessage('Verbindungsfehler: ' + error.message + ' ❌', 'error');
    }
});

// Nachricht anzeigen
function showMessage(text, type) {
    const messageDiv = document.getElementById('message');
    messageDiv.textContent = text;
    let alertClass = 'alert-danger';
    if (type === 'success') alertClass = 'alert-success';
    if (type === 'info') alertClass = 'alert-info';
    messageDiv.className = 'alert ' + alertClass;
    messageDiv.style.display = 'block';

    setTimeout(() => {
        messageDiv.style.display = 'none';
    }, 5000);
}

// Formular zurücksetzen
function resetForm() {
    const form = document.getElementById('quizForm');
    form.reset();
    form.classList.remove('was-validated');
    document.getElementById('answerCount').value = 5;
    document.getElementById('itemCount').value = 4;
    document.getElementById('categoryCount').value = 3;
    editingQuestionId = null;
    
    // Button-Text zurücksetzen
    const submitButton = document.querySelector('#quizForm button[type="submit"]');
    submitButton.innerHTML = '<i class="bi bi-check-circle-fill"></i> Frage speichern';
    submitButton.disabled = true;
    
    // Alle Steps außer dem ersten verstecken
    hideStep('step-questionType');
    hideStep('step-metadata');
    hideStep('step-buttons');
    
    toggleAnswerType();
}

// Fragen laden
async function loadQuestions() {
    try {
        const key = ensureReadKey();
        if (!key) return;

        const response = await fetch(API_URL, {
            headers: {
                'X-API-Key': key
            }
        });
        const questions = await response.json();

        const listDiv = document.getElementById('questionsList');
        
        if (questions.length === 0) {
            listDiv.innerHTML = '<p class="text-center text-muted">Noch keine Fragen vorhanden.</p>';
            return;
        }

        listDiv.innerHTML = questions.map(q => `
            <div class="card question-card mb-3">
                <div class="card-body">
                    <h5 class="card-title">${q.question}</h5>
                    <div class="mb-3">
                        <span class="badge bg-primary me-2"><i class="bi bi-tag-fill"></i> ${q.category}</span>
                        <span class="badge bg-secondary me-2"><i class="bi bi-speedometer2"></i> ${q.difficulty}</span>
                        <span class="badge bg-info"><i class="bi bi-question-circle-fill"></i> ${
                            q.questionType === 'text' ? 'Texteingabe' : 
                            q.questionType === 'matching' ? 'Zuordnung' : 
                            'Multiple Choice'
                        }</span>
                    </div>
                    ${q.questionType === 'multiple-choice' ? `
                        <div class="list-group list-group-flush">
                            ${q.answers.map((answer, index) => {
                                const isCorrect = q.correctAnswerIndices && q.correctAnswerIndices.includes(index);
                                return `
                                <div class="list-group-item answer ${isCorrect ? 'correct' : ''}">
                                    ${index + 1}. ${answer} ${isCorrect ? '<i class="bi bi-check-circle-fill text-success"></i>' : ''}
                                </div>
                                `;
                            }).join('')}
                        </div>
                    ` : q.questionType === 'matching' ? `
                        <div class="row">
                            <div class="col-md-5">
                                <strong>Items:</strong>
                                <ul class="list-group list-group-flush mt-2">
                                    ${q.leftItems.map((item, index) => `
                                        <li class="list-group-item">${index + 1}. ${item}</li>
                                    `).join('')}
                                </ul>
                            </div>
                            <div class="col-md-7">
                                <strong>Kategorien mit Zuordnungen:</strong>
                                <div class="mt-2">
                                    ${q.rightItems.map((category, catIndex) => {
                                        const mapping = q.correctMappings ? q.correctMappings.find(m => m.categoryIndex === catIndex) : null;
                                        const mappedItems = mapping && mapping.itemIndices ? 
                                            mapping.itemIndices.map(itemIdx => `Item ${itemIdx + 1}`).join(', ') : 
                                            'Keine Zuordnung';
                                        return `
                                        <div class="alert alert-success mb-2">
                                            <strong>${category}:</strong> ${mappedItems}
                                        </div>
                                        `;
                                    }).join('')}
                                </div>
                            </div>
                        </div>
                    ` : `
                        <div class="alert alert-success mt-2">
                            <strong>Richtige Antwort:</strong> ${q.textAnswer}
                        </div>
                    `}
                    <div class="mt-3">
                        <button class="btn btn-primary btn-sm me-2" onclick="editQuestion('${q.id}')">
                            <i class="bi bi-pencil-fill"></i> Bearbeiten
                        </button>
                        <button class="btn btn-danger btn-sm" onclick="deleteQuestion('${q.id}')">
                            <i class="bi bi-trash-fill"></i> Löschen
                        </button>
                    </div>
                </div>
            </div>
        `).join('');
    } catch (error) {
        console.error('Fehler beim Laden der Fragen:', error);
    }
}

// Frage bearbeiten
let editingQuestionId = null;

async function editQuestion(id) {
    try {
        const key = ensureReadKey();
        if (!key) return;

        const response = await fetch(`${API_URL}/${id}`, {
            headers: {
                'X-API-Key': key
            }
        });
        if (!response.ok) {
            showMessage('Fehler beim Laden der Frage! ❌', 'error');
            return;
        }
        
        const question = await response.json();
        
        // Formular mit Daten befüllen
        document.getElementById('question').value = question.question;
        document.getElementById('questionType').value = question.questionType;
        document.getElementById('category').value = question.category;
        document.getElementById('difficulty').value = question.difficulty;
        
        // Fragetyp-spezifische Felder befüllen
        toggleAnswerType();
        
        if (question.questionType === 'multiple-choice' && question.answers) {
            document.getElementById('answerCount').value = question.answers.length;
            updateAnswerFields();
            
            // Antworten befüllen
            question.answers.forEach((answer, index) => {
                const answerElement = document.getElementById(`answer${index}`);
                if (answerElement) {
                    answerElement.value = answer;
                }
            });
            
            // Richtige Antworten markieren (kann mehrere sein)
            if (question.correctAnswerIndices && question.correctAnswerIndices.length > 0) {
                question.correctAnswerIndices.forEach(correctIndex => {
                    const correctCheckbox = document.querySelector(`input[name="correct"][value="${correctIndex}"]`);
                    if (correctCheckbox) {
                        correctCheckbox.checked = true;
                    }
                });
            }
        } else if (question.questionType === 'text') {
            document.getElementById('textAnswer').value = question.textAnswer;
        } else if (question.questionType === 'matching') {
            // Zuordnungsfragen laden
            document.getElementById('itemCount').value = question.leftItems.length;
            document.getElementById('categoryCount').value = question.rightItems.length;
            updateMatchingFields();
            
            // Linke Items befüllen
            question.leftItems.forEach((item, index) => {
                const itemElement = document.getElementById(`leftItem${index}`);
                if (itemElement) {
                    itemElement.value = item;
                }
            });
            
            // Rechte Items (Kategorien) befüllen
            question.rightItems.forEach((category, index) => {
                const catElement = document.getElementById(`rightItem${index}`);
                if (catElement) {
                    catElement.value = category;
                }
            });
            
            // Zuordnungen markieren
            if (question.correctMappings) {
                question.correctMappings.forEach(mapping => {
                    const catIndex = mapping.categoryIndex;
                    const itemIndices = mapping.itemIndices;
                    itemIndices.forEach(itemIndex => {
                        const checkbox = document.getElementById(`mapping_${catIndex}_${itemIndex}`);
                        if (checkbox) {
                            checkbox.checked = true;
                        }
                    });
                });
            }
        }
        
        // ID merken für Update
        editingQuestionId = id;
        
        // Alle Steps sichtbar machen beim Bearbeiten
        showStep('step-questionType');
        showStep('step-metadata');
        showStep('step-buttons');
        
        // Button-Text ändern
        const submitButton = document.querySelector('#quizForm button[type="submit"]');
        submitButton.innerHTML = '<i class="bi bi-save-fill"></i> Änderungen speichern';
        submitButton.disabled = false;
        
        // Zum Formular scrollen
        document.getElementById('quizForm').scrollIntoView({ behavior: 'smooth' });
        
        showMessage('Frage wird bearbeitet - ändere die Felder und speichere', 'info');
    } catch (error) {
        showMessage('Verbindungsfehler: ' + error.message + ' ❌', 'error');
    }
}

// Frage löschen
async function deleteQuestion(id) {
    if (!confirm('Möchtest du diese Frage wirklich löschen?')) {
        return;
    }

    try {
        const adminKey = ensureAdminKey();
        if (!adminKey) return;

        const response = await fetch(`${API_URL}/${id}`, {
            method: 'DELETE',
            headers: {
                'X-API-Key': adminKey
            }
        });

        if (response.ok) {
            showMessage('Frage erfolgreich gelöscht! ✅', 'success');
            loadQuestions();
        } else {
            showMessage('Fehler beim Löschen der Frage! ❌', 'error');
        }
    } catch (error) {
        showMessage('Verbindungsfehler: ' + error.message + ' ❌', 'error');
    }
}

// Beim Laden der Seite Fragen laden und Formularschritte initialisieren
window.addEventListener('load', function() {
    loadQuestions();
    initializeFormSteps();
    document.getElementById('adminKeyInput').value = getAdminKey();
    updateAdminKeyState();
    const userInput = document.getElementById('userKeyInput');
    if (userInput) {
        userInput.value = getUserKey();
    }
    updateUserKeyState();
});
