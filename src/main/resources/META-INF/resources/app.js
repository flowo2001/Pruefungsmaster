const API_URL = '/api/quiz';

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
        
        // Validierung: Mindestens eine richtige Antwort muss ausgewählt sein
        if (correctAnswerIndices.length === 0) {
            showMessage('Bitte wähle mindestens eine richtige Antwort aus! ❌', 'error');
            return;
        }
        
        data.answers = answers;
        data.correctAnswerIndices = correctAnswerIndices;
        data.textAnswer = null;
        data.leftItems = null;
        data.rightItems = null;
        data.correctMappings = null;
    } else if (questionType === 'text') {
        const textAnswer = document.getElementById('textAnswer').value;
        data.answers = null;
        data.correctAnswerIndices = null;
        data.textAnswer = textAnswer;
        data.leftItems = null;
        data.rightItems = null;
        data.correctMappings = null;
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
        
        // Validierung
        if (leftItems.length === 0 || rightItems.length === 0) {
            showMessage('Bitte fülle alle Items und Kategorien aus! ❌', 'error');
            return;
        }
        
        if (correctMappings.length === 0) {
            showMessage('Bitte lege mindestens eine Zuordnung fest! ❌', 'error');
            return;
        }
        
        data.leftItems = leftItems;
        data.rightItems = rightItems;
        data.correctMappings = correctMappings;
        data.answers = null;
        data.correctAnswerIndices = null;
        data.textAnswer = null;
    }

    try {
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
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });

        if (response.ok) {
            const message = editingQuestionId ? 'Frage erfolgreich aktualisiert! ✅' : 'Frage erfolgreich gespeichert! ✅';
            showMessage(message, 'success');
            resetForm();
            loadQuestions();
        } else {
            showMessage('Fehler beim Speichern der Frage! ❌', 'error');
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
    
    toggleAnswerType();
}

// Fragen laden
async function loadQuestions() {
    try {
        const response = await fetch(API_URL);
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
        const response = await fetch(`${API_URL}/${id}`);
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
        
        // Button-Text ändern
        const submitButton = document.querySelector('#quizForm button[type="submit"]');
        submitButton.innerHTML = '<i class="bi bi-save-fill"></i> Änderungen speichern';
        
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
        const response = await fetch(`${API_URL}/${id}`, {
            method: 'DELETE'
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

// Beim Laden der Seite Fragen laden
window.addEventListener('load', loadQuestions);
