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
    loadStatistics();
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

let allQuestions = [];
let currentQuestions = [];
let currentQuestionIndex = 0;
let correctAnswers = 0;
let wrongAnswers = 0;
let userAnswers = [];

// Lade Statistiken beim Start
window.addEventListener('load', async function() {
    const input = document.getElementById('userKeyInput');
    if (input) {
        input.value = getUserKey();
    }
    updateUserKeyState();
    await loadStatistics();
    
    // Prüfe URL-Parameter für Kategorie
    const urlParams = new URLSearchParams(window.location.search);
    const category = urlParams.get('category');
    if (category) {
        document.getElementById('categoryFilter').value = category;
    }
});

// Lade Statistiken
async function loadStatistics() {
    try {
        const key = ensureUserKey();
        if (!key) return;

        const response = await fetch(`${API_URL}/statistics`, {
            headers: { 'X-API-Key': key }
        });
        const stats = await response.json();
        
        document.getElementById('totalQuestions').textContent = stats.totalQuestions;
        document.getElementById('mcQuestions').textContent = stats.multipleChoiceQuestions;
        document.getElementById('otherQuestions').textContent = stats.textQuestions + stats.matchingQuestions;
    } catch (error) {
        console.error('Fehler beim Laden der Statistiken:', error);
    }
}

// Starte Quiz
async function startQuiz() {
    const category = document.getElementById('filterCategory').value;
    const difficulty = document.getElementById('filterDifficulty').value;
    
    try {
        const key = ensureUserKey();
        if (!key) return;

        let url = `${API_URL}/filter?`;
        if (category) url += `category=${encodeURIComponent(category)}&`;
        if (difficulty) url += `difficulty=${encodeURIComponent(difficulty)}`;
        
        const response = await fetch(url, {
            headers: { 'X-API-Key': key }
        });
        allQuestions = await response.json();
        
        if (allQuestions.length === 0) {
            alert('Keine Fragen gefunden! Bitte erstelle zuerst Fragen.');
            return;
        }
        
        // Mische Fragen
        currentQuestions = shuffleArray([...allQuestions]);
        currentQuestionIndex = 0;
        correctAnswers = 0;
        wrongAnswers = 0;
        userAnswers = [];
        
        document.getElementById('quizSetup').style.display = 'none';
        document.getElementById('quizContainer').style.display = 'block';
        
        showQuestion();
    } catch (error) {
        console.error('Fehler beim Laden der Fragen:', error);
        alert('Fehler beim Laden der Fragen!');
    }
}

// Zeige aktuelle Frage
function showQuestion() {
    const question = currentQuestions[currentQuestionIndex];
    
    // Update UI
    document.getElementById('questionCounter').textContent = `Frage ${currentQuestionIndex + 1} / ${currentQuestions.length}`;
    document.getElementById('questionText').textContent = question.question;
    
    const progress = ((currentQuestionIndex + 1) / currentQuestions.length) * 100;
    document.getElementById('progressBar').style.width = progress + '%';
    document.getElementById('progressBar').textContent = Math.round(progress) + '%';
    
    // Fragetyp Badge
    let typeText = '';
    switch(question.questionType) {
        case 'multiple-choice': typeText = 'Multiple Choice'; break;
        case 'text': typeText = 'Texteingabe'; break;
        case 'matching': typeText = 'Zuordnung'; break;
    }
    document.getElementById('questionType').textContent = typeText;
    
    // Zeige Antworten basierend auf Typ
    const container = document.getElementById('answersContainer');
    container.innerHTML = '';
    
    if (question.questionType === 'multiple-choice') {
        question.answers.forEach((answer, index) => {
            const hasMultipleCorrect = question.correctAnswerIndices && question.correctAnswerIndices.length > 1;
            const inputType = hasMultipleCorrect ? 'checkbox' : 'radio';
            
            container.innerHTML += `
                <div class="form-check mb-3 answer-option">
                    <input class="form-check-input" type="${inputType}" name="answer" id="answer${index}" value="${index}">
                    <label class="form-check-label fs-5" for="answer${index}">
                        ${answer}
                    </label>
                </div>
            `;
        });
    } else if (question.questionType === 'text') {
        container.innerHTML = `
            <textarea class="form-control form-control-lg" id="textAnswerInput" rows="3" placeholder="Gib hier deine Antwort ein..."></textarea>
        `;
    } else if (question.questionType === 'matching') {
        container.innerHTML = '<h5 class="mb-3">Ordne die Items den Kategorien zu:</h5>';
        
        question.rightItems.forEach((category, catIndex) => {
            container.innerHTML += `
                <div class="card mb-3">
                    <div class="card-body">
                        <strong class="d-block mb-2">${category}:</strong>
                        ${question.leftItems.map((item, itemIndex) => `
                            <div class="form-check">
                                <input class="form-check-input" type="checkbox" id="matching_${catIndex}_${itemIndex}" value="${itemIndex}">
                                <label class="form-check-label" for="matching_${catIndex}_${itemIndex}">
                                    ${item}
                                </label>
                            </div>
                        `).join('')}
                    </div>
                </div>
            `;
        });
    }
    
    // Reset Buttons
    document.getElementById('checkButton').style.display = 'block';
    document.getElementById('nextButton').style.display = 'none';
    document.getElementById('feedbackContainer').style.display = 'none';
}

// Überprüfe Antwort
function checkAnswer() {
    const question = currentQuestions[currentQuestionIndex];
    let isCorrect = false;
    let userAnswer = null;
    
    if (question.questionType === 'multiple-choice') {
        const selectedIndices = Array.from(document.querySelectorAll('input[name="answer"]:checked'))
            .map(input => parseInt(input.value));
        
        userAnswer = selectedIndices;
        
        // Vergleiche Arrays
        const correctSet = new Set(question.correctAnswerIndices);
        const userSet = new Set(selectedIndices);
        
        isCorrect = correctSet.size === userSet.size && 
                   [...correctSet].every(val => userSet.has(val));
        
    } else if (question.questionType === 'text') {
        const userText = document.getElementById('textAnswerInput').value.trim();
        userAnswer = userText;
        
        // Case-insensitive Vergleich
        isCorrect = userText.toLowerCase() === question.textAnswer.toLowerCase();
        
    } else if (question.questionType === 'matching') {
        const userMappings = [];
        question.rightItems.forEach((_, catIndex) => {
            const selectedItems = [];
            question.leftItems.forEach((_, itemIndex) => {
                const checkbox = document.getElementById(`matching_${catIndex}_${itemIndex}`);
                if (checkbox && checkbox.checked) {
                    selectedItems.push(itemIndex);
                }
            });
            if (selectedItems.length > 0) {
                userMappings.push({
                    categoryIndex: catIndex,
                    itemIndices: selectedItems
                });
            }
        });
        
        userAnswer = userMappings;
        
        // Vergleiche Mappings
        isCorrect = compareMappings(question.correctMappings, userMappings);
    }
    
    // Speichere Antwort
    userAnswers.push({
        question: question,
        userAnswer: userAnswer,
        isCorrect: isCorrect
    });
    
    // Update Zähler
    if (isCorrect) {
        correctAnswers++;
    } else {
        wrongAnswers++;
    }
    
    // Zeige Feedback
    showFeedback(isCorrect, question);
    
    // Update Buttons
    document.getElementById('checkButton').style.display = 'none';
    document.getElementById('nextButton').style.display = 'block';
}

// Zeige Feedback
function showFeedback(isCorrect, question) {
    const container = document.getElementById('feedbackContainer');
    container.style.display = 'block';
    
    if (isCorrect) {
        container.innerHTML = `
            <div class="alert alert-success">
                <h4><i class="bi bi-check-circle-fill"></i> Richtig!</h4>
                <p class="mb-0">Sehr gut gemacht!</p>
            </div>
        `;
    } else {
        let correctAnswerText = '';
        
        if (question.questionType === 'multiple-choice') {
            const correctAnswers = question.correctAnswerIndices.map(i => question.answers[i]).join(', ');
            correctAnswerText = `Die richtige(n) Antwort(en): ${correctAnswers}`;
        } else if (question.questionType === 'text') {
            correctAnswerText = `Die richtige Antwort: ${question.textAnswer}`;
        } else if (question.questionType === 'matching') {
            correctAnswerText = 'Richtige Zuordnungen: <br>';
            question.correctMappings.forEach(mapping => {
                const category = question.rightItems[mapping.categoryIndex];
                const items = mapping.itemIndices.map(i => question.leftItems[i]).join(', ');
                correctAnswerText += `<strong>${category}:</strong> ${items}<br>`;
            });
        }
        
        container.innerHTML = `
            <div class="alert alert-danger">
                <h4><i class="bi bi-x-circle-fill"></i> Leider falsch</h4>
                <p class="mb-0">${correctAnswerText}</p>
            </div>
        `;
    }
}

// Nächste Frage
function nextQuestion() {
    currentQuestionIndex++;
    
    if (currentQuestionIndex >= currentQuestions.length) {
        showResults();
    } else {
        showQuestion();
    }
}

// Zeige Ergebnisse
function showResults() {
    document.getElementById('quizContainer').style.display = 'none';
    document.getElementById('resultsContainer').style.display = 'block';
    
    const total = currentQuestions.length;
    const percentage = Math.round((correctAnswers / total) * 100);
    
    document.getElementById('scorePercentage').textContent = percentage + '%';
    document.getElementById('scoreText').textContent = `${correctAnswers} von ${total} richtig`;
    document.getElementById('correctCount').textContent = correctAnswers;
    document.getElementById('wrongCount').textContent = wrongAnswers;
    
    // Badge basierend auf Ergebnis
    const badgeEl = document.getElementById('resultBadge');
    if (percentage >= 90) {
        badgeEl.textContent = 'Ausgezeichnet! 🏆';
        badgeEl.className = 'badge fs-5 bg-success';
    } else if (percentage >= 75) {
        badgeEl.textContent = 'Sehr gut! 🌟';
        badgeEl.className = 'badge fs-5 bg-info';
    } else if (percentage >= 60) {
        badgeEl.textContent = 'Gut gemacht! 👍';
        badgeEl.className = 'badge fs-5 bg-primary';
    } else if (percentage >= 50) {
        badgeEl.textContent = 'Bestanden ✓';
        badgeEl.className = 'badge fs-5 bg-warning';
    } else {
        badgeEl.textContent = 'Weiter üben! 📚';
        badgeEl.className = 'badge fs-5 bg-danger';
    }
}

// Quiz zurücksetzen
function resetQuiz() {
    document.getElementById('resultsContainer').style.display = 'none';
    document.getElementById('quizSetup').style.display = 'block';
    loadStatistics();
}

// Quiz beenden
function endQuiz() {
    if (confirm('Möchtest du das Quiz wirklich beenden?')) {
        resetQuiz();
    }
}

// Hilfsfunktion: Array mischen
function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

// Hilfsfunktion: Mappings vergleichen
function compareMappings(correct, user) {
    if (correct.length !== user.length) return false;
    
    for (const correctMapping of correct) {
        const userMapping = user.find(m => m.categoryIndex === correctMapping.categoryIndex);
        if (!userMapping) return false;
        
        const correctSet = new Set(correctMapping.itemIndices);
        const userSet = new Set(userMapping.itemIndices);
        
        if (correctSet.size !== userSet.size) return false;
        if (![...correctSet].every(val => userSet.has(val))) return false;
    }
    
    return true;
}
