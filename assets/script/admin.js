const repoOwner = 'BenceBarens'; 
const repoName = 'xolunar'; 
const branch = 'main';
const videosFilePath = 'videos.json';

const cldName = 'tuxorysm';
const cldKey = '692587191835941';

const statusBox = document.getElementById('status');
const uploadBtn = document.getElementById('upload-btn');
const fileListElement = document.getElementById('file-list');
const loginStatusBox = document.getElementById('login-status');

const authStateSection = document.getElementById('auth-state');
const dashboardSection = document.getElementById('dashboard');
const addingFileSection = document.querySelector('.adding-file');
const fileSection = document.querySelector('.file-section');
const videoSections = document.querySelectorAll('.video-control-section');

let currentVideosSha = null;

// ==========================================
// AUTHENTICATIE & SESSIE
// ==========================================

function getAuthCredentials() {
    return {
        token: sessionStorage.getItem('gh_admin_token'),
        cldSecret: sessionStorage.getItem('cld_secret')
    };
}

async function verifyAndInit(creds) {
    try {
        const res = await fetch('https://api.github.com/user', {
            headers: {
                'Authorization': `Bearer ${creds.token}`,
                'Accept': 'application/vnd.github+json'
            }
        });
        if (!res.ok) throw new Error('Ongeldige GitHub token');

        authStateSection.classList.add('is-hidden');
        dashboardSection.classList.remove('is-hidden');
        loadFiles();
    } catch (err) {
        logout();
    }
}

async function loginWithCredentials() {
    const token = document.getElementById('token-input').value.trim();
    const cldSecret = document.getElementById('cld-secret-input').value.trim();

    if (!token || !cldSecret) {
        loginStatusBox.innerText = 'Vul je GitHub PAT én Cloudinary API Secret in.';
        loginStatusBox.className = 'error';
        loginStatusBox.style.display = 'block';
        return;
    }

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
        if (!res.ok) throw new Error('GitHub token is ongeldig of verlopen.');

        sessionStorage.setItem('gh_admin_token', token);
        sessionStorage.setItem('cld_secret', cldSecret);

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
    sessionStorage.removeItem('cld_secret');

    authStateSection.classList.remove('is-hidden');
    dashboardSection.classList.add('is-hidden');
}

const savedCreds = getAuthCredentials();
if (savedCreds.token && savedCreds.cldSecret) {
    verifyAndInit(savedCreds);
}

// ==========================================
// CRYPTO HELPERS (SHA-1 SIGNATURE GENERATOR)
// ==========================================

async function generateSignature(params, secret) {
    const sortedKeys = Object.keys(params).sort();
    const stringToSign = sortedKeys.map(key => `${key}=${params[key]}`).join('&') + secret;

    const encoder = new TextEncoder();
    const data = encoder.encode(stringToSign);
    const hashBuffer = await crypto.subtle.digest('SHA-1', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// ==========================================
// BESTANDEN & VIDEOS.JSON LADEN
// ==========================================

async function loadFiles() {
    const { token } = getAuthCredentials();
    if (!token) return;

    const selectedFolder = document.querySelector('input[name="folder"]:checked').value;

    if (selectedFolder === 'videos_json') {
        addingFileSection.classList.add('is-hidden');
        fileSection.classList.add('is-hidden');
        videoSections.forEach(sec => sec.classList.remove('is-hidden'));
        loadVideosJson();
        return;
    } else {
        addingFileSection.classList.remove('is-hidden');
        fileSection.classList.remove('is-hidden');
        videoSections.forEach(sec => sec.classList.add('is-hidden'));
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
// CLOUDINARY SIGNED DELETE HELPER
// ==========================================

async function deleteVideoFromCloudinary(url) {
    const { cldSecret } = getAuthCredentials();
    if (!url || !cldSecret) return;

    try {
        const uploadIndex = url.indexOf('/upload/');
        if (uploadIndex === -1) throw new Error('Geen geldige Cloudinary URL.');

        // Pak alles na '/upload/'
        let pathAfterUpload = url.substring(uploadIndex + 8);

        const pathSegments = pathAfterUpload.split('/').filter(segment => {
            return !segment.includes(',') && !/^v\d+$/.test(segment);
        });

        const fullPath = pathSegments.join('/');
        
        const lastDotIndex = fullPath.lastIndexOf('.');
        const publicId = lastDotIndex !== -1 ? fullPath.substring(0, lastDotIndex) : fullPath;

        console.log(`Cloudinary video verwijderen met Public ID: "${publicId}"`);

        const timestamp = Math.floor(Date.now() / 1000);
        
        const params = { 
            public_id: publicId, 
            timestamp: timestamp 
        };

        const signature = await generateSignature(params, cldSecret);

        const formData = new FormData();
        formData.append('public_id', publicId);
        formData.append('api_key', cldKey);
        formData.append('timestamp', timestamp);
        formData.append('signature', signature);

        const res = await fetch(`https://api.cloudinary.com/v1_1/${cldName}/video/destroy`, {
            method: 'POST',
            body: formData
        });

        const data = await res.json();
        if (data.result !== 'ok') {
            console.warn('Cloudinary destroy response:', data);
        } else {
            console.log('Video succesvol gewist op Cloudinary!');
        }
    } catch (err) {
        console.error('Fout bij verwijderen van Cloudinary:', err);
    }
}

// ==========================================
// GEAUTOMATISEERD VIDEO BEHEER (VIDEOS.JSON)
// ==========================================

async function loadVideosJson() {
    const { token } = getAuthCredentials();
    const videoListElement = document.getElementById('video-file-list');
    videoListElement.innerHTML = '<li>Loading videos.json...</li>';

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

        renderVideoList(videoList);
    } catch (err) {
        videoListElement.innerHTML = `<li class="empty-msg">Error loading: ${err.message}</li>`;
    }
}

function renderVideoList(videos) {
    const videoListElement = document.getElementById('video-file-list');
    videoListElement.innerHTML = '';

    if (!videos || videos.length === 0) {
        videoListElement.innerHTML = '<li class="empty-msg">No videos found.</li>';
        return;
    }

    videos.forEach((video, index) => {
        const fileName = video.url.split('/').pop();

        const li = document.createElement('li');
        li.className = 'file-item';
        li.innerHTML = `
            <input type="text" class="video-folder-edit" value="${video.folder || 'canvas'}" onchange="updateVideoFolder(${index}, this.value)" title="Edit folder name">
            <span class="file-name">${fileName}</span>
            <button class="btn-delete" onclick="deleteVideoItem(${index})">Delete</button>
        `;
        videoListElement.appendChild(li);
    });
}

async function updateVideoFolder(index, newFolder) {
    const { token } = getAuthCredentials();
    const cleanFolder = newFolder.trim() || 'canvas';

    showStatus('Updating folder name on GitHub...', '');

    try {
        const jsonRes = await fetch(`https://api.github.com/repos/${repoOwner}/${repoName}/contents/${videosFilePath}?ref=${branch}`, {
            headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/vnd.github+json' }
        });

        if (!jsonRes.ok) throw new Error('Could not fetch videos.json');

        const fileData = await jsonRes.json();
        currentVideosSha = fileData.sha;
        const jsonString = decodeURIComponent(escape(atob(fileData.content.replace(/\s/g, ''))));
        let videoList = JSON.parse(jsonString || '[]');

        if (videoList[index]) {
            videoList[index].folder = cleanFolder;
        }

        await saveVideosJsonData(videoList);
        showStatus('Folder name updated successfully!', 'success');
    } catch (err) {
        showStatus(`Error updating folder: ${err.message}`, 'error');
        loadVideosJson();
    }
}

async function uploadAndSyncVideo() {
    const { token, cldSecret } = getAuthCredentials();
    const fileInput = document.getElementById('cld-file-input');
    const folderInput = document.getElementById('video-folder-input');
    const uploadBtn = document.getElementById('cld-upload-btn');

    if (!fileInput.files.length) {
        showStatus('Selecteer eerst een videobestand.', 'error');
        return;
    }

    const file = fileInput.files[0];
    const folderName = folderInput.value.trim() || 'canvas';
    const timestamp = Math.floor(Date.now() / 1000);

    const originalFileName = file.name.substring(0, file.name.lastIndexOf('.')) || file.name;

    const params = {
        public_id: originalFileName,
        timestamp: timestamp,
        unique_filename: 'false',
        use_filename: 'true'
    };

    const signature = await generateSignature(params, cldSecret);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('api_key', cldKey);
    formData.append('public_id', originalFileName);
    formData.append('timestamp', timestamp);
    formData.append('use_filename', 'true');
    formData.append('unique_filename', 'false');
    formData.append('signature', signature);

    uploadBtn.disabled = true;
    showStatus(`Uploading "${file.name}" to Cloudinary...`, '');

    try {
        const res = await fetch(`https://api.cloudinary.com/v1_1/${cldName}/video/upload`, {
            method: 'POST',
            body: formData
        });

        if (!res.ok) {
            const errData = await res.json();
            throw new Error(errData.error?.message || 'Cloudinary upload failed.');
        }

        const data = await res.json();
        const formattedUrl = formatCloudinaryUrl(data.secure_url);

        showStatus(`Video geüpload! 'videos.json' bijwerken op GitHub...`, '');
        const jsonRes = await fetch(`https://api.github.com/repos/${repoOwner}/${repoName}/contents/${videosFilePath}?ref=${branch}`, {
            headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/vnd.github+json' }
        });
        
        let videoList = [];
        if (jsonRes.ok) {
            const fileData = await jsonRes.json();
            currentVideosSha = fileData.sha;
            const jsonString = decodeURIComponent(escape(atob(fileData.content.replace(/\s/g, ''))));
            videoList = JSON.parse(jsonString || '[]');
        }

        videoList.push({
            folder: folderName,
            url: formattedUrl
        });

        await saveVideosJsonData(videoList);

        showStatus(`Video "${file.name}" succesvol geüpload en opgeslagen in videos.json!`, 'success');
        fileInput.value = '';
        loadVideosJson();
    } catch (err) {
        showStatus(`Fout: ${err.message}`, 'error');
    } finally {
        uploadBtn.disabled = false;
    }
}

async function deleteVideoItem(index) {
    const { token } = getAuthCredentials();
    
    const jsonRes = await fetch(`https://api.github.com/repos/${repoOwner}/${repoName}/contents/${videosFilePath}?ref=${branch}`, {
        headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/vnd.github+json' }
    });

    if (!jsonRes.ok) {
        showStatus('Kon videos.json niet ophalen om te verwijderen.', 'error');
        return;
    }

    const fileData = await jsonRes.json();
    currentVideosSha = fileData.sha;
    const jsonString = decodeURIComponent(escape(atob(fileData.content.replace(/\s/g, ''))));
    let videoList = JSON.parse(jsonString || '[]');

    const targetVideo = videoList[index];
    if (!targetVideo) return;

    if (!confirm(`Weet je zeker dat je "${targetVideo.url.split('/').pop()}" wilt verwijderen uit videos.json én Cloudinary?`)) return;

    showStatus('Video verwijderen...', '');

    try {
        await deleteVideoFromCloudinary(targetVideo.url);
        videoList.splice(index, 1);
        await saveVideosJsonData(videoList);

        showStatus('Video succesvol verwijderd uit videos.json en Cloudinary!', 'success');
        loadVideosJson();
    } catch (err) {
        showStatus(`Fout bij verwijderen: ${err.message}`, 'error');
    }
}

async function saveVideosJsonData(videoArray) {
    const { token } = getAuthCredentials();
    const jsonContent = JSON.stringify(videoArray, null, 2);
    const base64Content = btoa(unescape(encodeURIComponent(jsonContent)));

    const bodyData = {
        message: `CONTENT: update videos.json (${videoArray.length} videos)`,
        content: base64Content,
        branch: branch
    };

    if (currentVideosSha) bodyData.sha = currentVideosSha;

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
        throw new Error(errData.message || 'Fout bij opslaan van videos.json');
    }

    const resultData = await res.json();
    currentVideosSha = resultData.content.sha;
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
// REGULIERE UPLOAD & DELETE (GITHUB)
// ==========================================

async function uploadFile() {
    const { token } = getAuthCredentials();
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

    const { token } = getAuthCredentials();
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

        showStatus(`"${fileName}" deleted successfully.`, 'success');
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