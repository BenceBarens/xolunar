const repoOwner = 'BenceBarens'; 
const repoName = 'xolunar'; 
const branch = 'main';

const statusBox = document.getElementById('status');
const uploadBtn = document.getElementById('upload-btn');
const fileListElement = document.getElementById('file-list');
const loginStatusBox = document.getElementById('login-status');

function getAuthToken() {
    return sessionStorage.getItem('gh_admin_token');
}

async function verifyAndInit(token) {
    try {
        const res = await fetch('https://api.github.com/user', {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/vnd.github+json'
            }
        });
        if (!res.ok) throw new Error('Ongeldig token');
        const user = await res.json();
        
        document.getElementById('auth-state').style.display = 'none';
        document.getElementById('dashboard').style.display = 'block';
        loadFiles();
    } catch (err) {
        logout();
    }
}

async function loginWithToken() {
    const token = document.getElementById('token-input').value.trim();
    if (!token) return;

    loginStatusBox.innerText = 'Verifying...';
    loginStatusBox.className = '';
    loginStatusBox.style.display = 'block';

    try {
        const res = await fetch('https://api.github.com/user', {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/vnd.github+json'
            }
        });
        if (!res.ok) throw new Error('Token is ongeldig of heeft geen toegang.');
        
        const user = await res.json();
        sessionStorage.setItem('gh_admin_token', token);
        
        document.getElementById('auth-state').style.display = 'none';
        document.getElementById('dashboard').style.display = 'block';
        loginStatusBox.style.display = 'none';
        loadFiles();
    } catch (err) {
        loginStatusBox.innerText = err.message;
        loginStatusBox.className = 'error';
        loginStatusBox.style.display = 'block';
    }
}

function logout() {
    sessionStorage.removeItem('gh_admin_token');
    document.getElementById('auth-state').style.display = 'block';
    document.getElementById('dashboard').style.display = 'none';
    document.getElementById('token-input').value = '';
}

const savedToken = getAuthToken();
if (savedToken) {
    verifyAndInit(savedToken);
}

async function loadFiles() {
    const token = getAuthToken();
    if (!token) return;

    const folder = document.querySelector('input[name="folder"]:checked').value;
    fileListElement.innerHTML = '<li>Loading...</li>';

    try {
        const res = await fetch(`https://api.github.com/repos/${repoOwner}/${repoName}/contents/${encodeURIComponent(folder)}?ref=${branch}`, {
            headers: { 
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/vnd.github+json'
            }
        });

        if (res.status === 404) {
            fileListElement.innerHTML = '<li class="empty-msg">Folder is empty or non-existent.</li>';
            return;
        }

        if (!res.ok) throw new Error("Couldn't fetch files.");

        const data = await res.json();
        const files = Array.isArray(data) ? data.filter(item => item.type === 'file') : [];

        if (files.length === 0) {
            fileListElement.innerHTML = '<li class="empty-msg">No files found in this folder</li>';
            return;
        }

        fileListElement.innerHTML = '';
        files.forEach(file => {
            const li = document.createElement('li');
            li.className = 'file-item';
            li.innerHTML = `
                <span class="file-name">${file.name}</span>
                <button class="btn-delete" onclick="deleteFile('${file.name}', '${file.sha}')">Delete</button>
            `;
            fileListElement.appendChild(li);
        });
    } catch (err) {
        fileListElement.innerHTML = `<li class="empty-msg">Error loading: ${err.message}</li>`;
    }
}

async function uploadFile() {
    const token = getAuthToken();
    const fileInput = document.getElementById('file');
    const folder = document.querySelector('input[name="folder"]:checked').value;

    if (!fileInput.files.length) {
        showStatus('Choose a file', 'error');
        return;
    }

    const file = fileInput.files[0];
    const filePath = `${folder}/${file.name}`;
    
    uploadBtn.disabled = true;
    showStatus('Uploading and committing GitHub...', '');

    try {
        const base64Content = await toBase64(file);

        const res = await fetch(`https://api.github.com/repos/${repoOwner}/${repoName}/contents/${encodeURIComponent(filePath)}`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/vnd.github+json',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                message: `CONTENT: uploaded ${file.name} to ${folder}`,
                content: base64Content.split(',')[1],
                branch: branch
            })
        });

        if (!res.ok) {
            const errData = await res.json();
            throw new Error(errData.message || 'Error uploading');
        }

        showStatus(`"${file.name}" uploaded successfully.`, 'success');
        fileInput.value = '';
        loadFiles();
    } catch (err) {
        showStatus(`Fout: ${err.message}`, 'error');
    } finally {
        uploadBtn.disabled = false;
    }
}

async function deleteFile(fileName, sha) {
    if (!confirm(`Are you sure you want to delete "${fileName}"?`)) return;

    const token = getAuthToken();
    const folder = document.querySelector('input[name="folder"]:checked').value;
    const filePath = `${folder}/${fileName}`;

    showStatus(`"${fileName}" deleting...`, '');

    try {
        const res = await fetch(`https://api.github.com/repos/${repoOwner}/${repoName}/contents/${encodeURIComponent(filePath)}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/vnd.github+json',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                message: `CONTENT: deleted ${fileName} from ${folder}`,
                sha: sha,
                branch: branch
            })
        });

        if (!res.ok) {
            const errData = await res.json();
            throw new Error(errData.message || 'Error deleting');
        }

        showStatus(`"${fileName}" deleted successfully`, 'success');
        loadFiles();
    } catch (err) {
        showStatus(`Error deleting ${err.message}`, 'error');
    }
}

function toBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result);
        reader.onerror = error => reject(error);
    });
}

function showStatus(msg, type) {
    statusBox.innerText = msg;
    statusBox.className = type;
    statusBox.style.display = msg ? 'block' : 'none';
}