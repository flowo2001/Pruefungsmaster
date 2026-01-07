const USER_KEY_STORAGE = 'quizUserKey';
const ADMIN_KEY_STORAGE = 'quizAdminKey';
const MANAGER_KEY_STORAGE = 'quizKeyManagerKey';

const messageEl = document.getElementById('message');
const userInput = document.getElementById('userKeyInput');
const adminInput = document.getElementById('adminKeyInput');
const managerInput = document.getElementById('managerKeyInput');
const saveBtn = document.getElementById('saveBtn');
const clearBtn = document.getElementById('clearBtn');

function showMessage(text) {
    messageEl.textContent = text;
    messageEl.style.display = 'block';
}

function hideMessage() {
    messageEl.style.display = 'none';
}

function saveKeys() {
    hideMessage();
    const userKey = userInput.value.trim();
    const adminKey = adminInput.value.trim();
    const managerKey = managerInput.value.trim();

    if (!userKey && !adminKey) {
        showMessage('Bitte mindestens einen User- oder Admin-Key eingeben.');
        return;
    }

    if (userKey) localStorage.setItem(USER_KEY_STORAGE, userKey);
    if (adminKey) localStorage.setItem(ADMIN_KEY_STORAGE, adminKey);
    if (managerKey) localStorage.setItem(MANAGER_KEY_STORAGE, managerKey);

    const params = new URLSearchParams(window.location.search);
    const redirect = params.get('redirect') || 'overview.html';
    window.location.href = redirect;
}

function clearKeys() {
    hideMessage();
    localStorage.removeItem(USER_KEY_STORAGE);
    localStorage.removeItem(ADMIN_KEY_STORAGE);
    localStorage.removeItem(MANAGER_KEY_STORAGE);
    userInput.value = '';
    adminInput.value = '';
    managerInput.value = '';
}

function init() {
    userInput.value = localStorage.getItem(USER_KEY_STORAGE) || '';
    adminInput.value = localStorage.getItem(ADMIN_KEY_STORAGE) || '';
    managerInput.value = localStorage.getItem(MANAGER_KEY_STORAGE) || '';

    saveBtn.addEventListener('click', saveKeys);
    clearBtn.addEventListener('click', clearKeys);
}

init();
