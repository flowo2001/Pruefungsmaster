const API_URL = '/api/keys';
const MANAGER_KEY_STORAGE = 'quizKeyManagerKey';

function getManagerKey() {
    return localStorage.getItem(MANAGER_KEY_STORAGE) || '';
}

async function loadKeys() {
    const key = getManagerKey();
    if (!key) {
        document.getElementById('keysTableContainer').innerHTML = '<p class="text-danger">Bitte zuerst den Key-Manager-Schlüssel speichern.</p>';
        return;
    }

    try {
        const response = await fetch(API_URL, {
            headers: { 'X-API-Key': key }
        });

        if (!response.ok) {
            document.getElementById('keysTableContainer').innerHTML = '<p class="text-danger">Abruf fehlgeschlagen (HTTP ' + response.status + ').</p>';
            return;
        }

        const keys = await response.json();
        if (!keys || keys.length === 0) {
            document.getElementById('keysTableContainer').innerHTML = '<p class="text-muted">Keine Keys vorhanden.</p>';
            return;
        }

        const rows = keys.map(k => `
            <tr>
                <td>${k.label || '-'}</td>
                <td>${k.displayName || '-'}</td>
                <td><span class="badge ${k.role === 'ADMIN' ? 'bg-primary' : k.role === 'KEY_MANAGER' ? 'bg-info' : 'bg-success'}">${k.role}</span></td>
                <td>${k.createdAt}</td>
                <td><code>${k.userId || '-'}</code></td>
                <td>${k.maskedKey}</td>
                <td class="text-end">
                    <button class="btn btn-sm btn-outline-danger" onclick="deleteKey('${k.id}')"><i class="bi bi-trash"></i></button>
                </td>
            </tr>
        `).join('');

        document.getElementById('keysTableContainer').innerHTML = `
            <div class="table-responsive">
                <table class="table align-middle">
                    <thead>
                        <tr>
                            <th>Bezeichnung</th>
                            <th>Nutzername</th>
                            <th>Rolle</th>
                            <th>Erstellt am</th>
                            <th>UserId</th>
                            <th>Key</th>
                            <th></th>
                        </tr>
                    </thead>
                    <tbody>${rows}</tbody>
                </table>
            </div>
        `;
    } catch (err) {
        document.getElementById('keysTableContainer').innerHTML = '<p class="text-danger">Fehler: ' + err.message + '</p>';
    }
}

async function createKey() {
    const key = getManagerKey();
    if (!key) {
        alert('Bitte zuerst den Key-Manager-Schlüssel speichern.');
        return;
    }

    const role = document.getElementById('newKeyRole').value;
    const label = document.getElementById('newKeyLabel').value.trim();
    const displayName = document.getElementById('newKeyDisplayName')?.value.trim();

    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-API-Key': key
            },
            body: JSON.stringify({ role, label, displayName })
        });

        if (!response.ok) {
            document.getElementById('newKeyResult').style.display = 'block';
            document.getElementById('newKeyResult').className = 'alert alert-danger';
            document.getElementById('newKeyResult').textContent = 'Fehler beim Erstellen (HTTP ' + response.status + ').';
            return;
        }

        const data = await response.json();
        document.getElementById('newKeyResult').style.display = 'block';
        document.getElementById('newKeyResult').className = 'alert alert-success';
        document.getElementById('newKeyResult').innerHTML = `
            <strong>Neuer Key erstellt!</strong><br>
            Rolle: ${data.role}<br>
            Label: ${data.label || '-'}<br>
            Nutzername: ${data.displayName || '-'}<br>
            UserId: ${data.userId}<br>
            <code>${data.key}</code>
        `;
        loadKeys();
    } catch (err) {
        document.getElementById('newKeyResult').style.display = 'block';
        document.getElementById('newKeyResult').className = 'alert alert-danger';
        document.getElementById('newKeyResult').textContent = 'Fehler: ' + err.message;
    }
}

async function deleteKey(id) {
    const key = getManagerKey();
    if (!key) {
        alert('Bitte zuerst den Key-Manager-Schlüssel speichern.');
        return;
    }

    if (!confirm('Key wirklich löschen?')) return;

    try {
        const response = await fetch(`${API_URL}/${id}`, {
            method: 'DELETE',
            headers: { 'X-API-Key': key }
        });
        if (!response.ok) {
            alert('Löschen fehlgeschlagen (HTTP ' + response.status + ').');
            return;
        }
        loadKeys();
    } catch (err) {
        alert('Fehler: ' + err.message);
    }
}

window.addEventListener('load', () => {
    loadKeys();
});
