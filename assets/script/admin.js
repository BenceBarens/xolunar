const repoOwner = 'BenceBarens'; 
const repoName = 'xolunar'; 
const branch = 'main';
const videosFilePath = 'videos.json';

const statusBox = document.getElementById('status');
const uploadBtn = document.getElementById('upload-btn');
const fileListElement = document.getElementById('file-list');
const loginStatusBox = document.getElementById('login-status');

const authStateSection = document.getElementById('auth-state');
const dashboardSection = document.getElementById('dashboard');
const videoEditorSection = document.getElementById('video-editor-section');
const videoRowsContainer = document.getElementById('video-rows');
const saveVideosBtn = document.getElementById('save-videos-btn');
const addingFileSection = document.querySelector('.adding-file');
const fileSection = document.querySelector('.file-section');

let currentVideosSha = null;

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
        
        authStateSection.classList.add('is-hidden');
        dashboardSection.classList.remove('is-hidden');
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
        if (!res.ok) throw new Error('Token is invalid, expired or has no access.');
        
        sessionStorage.setItem('gh_admin_token', token);
        
        authStateSection.classList.add('is-hidden');
        dashboardSection.classList.remove('is-hidden');
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
    authStateSection.classList.remove('is-hidden');
    dashboardSection.classList.add('is-hidden');
    document.getElementById('token-input').value = '';
}

const savedToken = getAuthToken();
if (savedToken) {
    verifyAndInit(savedToken);
}

// ==========================================
// BESTANDEN & VIDEOS.JSON LADEN
// ==========================================

async function loadFiles() {
    const token = getAuthToken();
    if (!token) return;

    const selectedFolder = document.querySelector('input[name="folder"]:checked').value;

    if (selectedFolder === 'videos_json') {
        addingFileSection.classList.add('is-hidden');
        fileSection.classList.add('is-hidden');
        videoEditorSection.classList.remove('is-hidden');
        loadVideosJson();
        return;
    } else {
        addingFileSection.classList.remove('is-hidden');
        fileSection.classList.remove('is-hidden');
        videoEditorSection.classList.add('is-hidden');
    }

    fileListElement.innerHTML = '<li>Loading...</li>';

    try {
        const res = await fetch(`https://api.github.com/repos/${repoOwner}/${repoName}/contents/${encodeURIComponent(selectedFolder)}?ref=${branch}`, {
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

// ==========================================
// VIDEOS.JSON BEHEREN
// ==========================================

async function loadVideosJson() {
    const token = getAuthToken();
    videoRowsContainer.innerHTML = '<p>Loading videos.json from GitHub...</p>';
    showStatus('', '');

    try {
        const res = await fetch(`https://api.github.com/repos/${repoOwner}/${repoName}/contents/${videosFilePath}?ref=${branch}`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/vnd.github+json'
            }
        });

        if (!res.ok) throw new Error('Could not load videos.json');

        const fileData = await res.json();
        currentVideosSha = fileData.sha;

        const jsonString = decodeURIComponent(escape(atob(fileData.content.replace(/\s/g, ''))));
        const videoList = JSON.parse(jsonString || '[]');

        renderVideoRows(videoList);
    } catch (err) {
        videoRowsContainer.innerHTML = `<p class="error">Error loading videos.json: ${err.message}</p>`;
    }
}

function renderVideoRows(videos) {
    videoRowsContainer.innerHTML = '';

    if (!videos || videos.length === 0) {
        addVideoRow();
        return;
    }

    videos.forEach(video => {
        addVideoRow(video.folder || 'canvas', video.url || '');
    });
}

function addVideoRow(folder = 'canvas', url = '') {
    const row = document.createElement('div');
    row.className = 'video-row';

    const formattedUrl = formatCloudinaryUrl(url);

    row.innerHTML = `
        <input type="text" class="video-folder-input" placeholder="Folder (e.g. canvas)" value="${folder}">
        <input type="text" class="video-url-input" placeholder="Cloudinary URL" value="${formattedUrl}">
        <button type="button" class="btn-delete" onclick="this.parentElement.remove()">Remove</button>
    `;

    const urlInput = row.querySelector('.video-url-input');
    urlInput.addEventListener('change', () => {
        urlInput.value = formatCloudinaryUrl(urlInput.value);
    });

    videoRowsContainer.appendChild(row);
}

async function saveVideosJson() {
    const token = getAuthToken();
    if (!token) return;

    const rows = videoRowsContainer.querySelectorAll('.video-row');
    const updatedVideos = [];

    rows.forEach(row => {
        const folder = row.querySelector('.video-folder-input').value.trim();
        const rawUrl = row.querySelector('.video-url-input').value.trim();
        if (rawUrl) {
            updatedVideos.push({
                folder: folder || 'overig',
                url: formatCloudinaryUrl(rawUrl)
            });
        }
    });

    if (saveVideosBtn) saveVideosBtn.disabled = true;
    showStatus('Saving videos.json to GitHub...', '');

    try {
        const jsonContent = JSON.stringify(updatedVideos, null, 2);
        const base64Content = btoa(unescape(encodeURIComponent(jsonContent)));

        const bodyData = {
            message: `CONTENT: update videos.json (${updatedVideos.length} videos)`,
            content: base64Content,
            branch: branch
        };

        if (currentVideosSha) {
            bodyData.sha = currentVideosSha;
        }

        const res = await fetch(`https://api.github.com/repos/${repoOwner}/${repoName}/contents/${videosFilePath}`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/vnd.github+json',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(bodyData)
        });

        if (!res.ok) {
            const errData = await res.json();
            throw new Error(errData.message || 'Error updating videos.json');
        }

        const resultData = await res.json();
        currentVideosSha = resultData.content.sha;

        showStatus('videos.json updated and committed successfully!', 'success');
    } catch (err) {
        showStatus(`Error saving: ${err.message}`, 'error');
    } finally {
        if (saveVideosBtn) saveVideosBtn.disabled = false;
    }
}

function formatCloudinaryUrl(url) {
    if (!url || typeof url !== 'string') return '';
    let cleanUrl = url.trim();

    const targetParams = 'w_300,h_300,c_fit,q_auto,f_auto';

    if (cleanUrl.includes('/video/upload/')) {
        cleanUrl = cleanUrl.replace(
            /\/video\/upload\/(?:[^/]+\/)?(v\d+\/.*|[a-zA-Z0-9_-]+\.[a-z0-9]+.*)/,
            `/video/upload/${targetParams}/$1`
        );
    } else if (cleanUrl.includes('/upload/')) {
        cleanUrl = cleanUrl.replace(
            /\/upload\/(?:[^/]+\/)?(v\d+\/.*|[a-zA-Z0-9_-]+\.[a-z0-9]+.*)/,
            `/upload/${targetParams}/$1`
        );
    }

    return cleanUrl;
}

// ==========================================
// REGULIERE UPLOAD & DELETE
// ==========================================

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

        showStatus(`"${file.name}" uploaded successfully (may take few minutes to appear on website and admin panel, cookies may play a role).`, 'success');
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

        showStatus(`"${fileName}" deleted successfully (may take a few minutes to dissappear from website and admin panel, cookies may play a role).`, 'success');
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