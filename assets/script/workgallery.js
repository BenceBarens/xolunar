// Website Made by Bence (bencebarens.nl)

// ==========================================
// SETTINGS & GLOBALS
// ==========================================

const GLOBAL_SETTINGS = {
    mediaUrl: '../media.json',
    imageQuality: 80,
    imageFormat: 'webp',
    githubBaseUrl: 'https://raw.githubusercontent.com/BenceBarens/xolunar/main/assets/media/Photo/'
};

const layout = { itemWidth: 400 }; 

const lightbox = document.querySelector('#lightbox');
const lightboxMedia = document.querySelector('#lightbox-media');
const lightboxTitle = document.querySelector('#lightbox-title');
const lightboxClose = document.querySelector('#lightbox-close');

// ==========================================
// HELPER FUNCTIONS
// ==========================================

function isVideoFile(fileName) {
    return /\.(mp4|webm|mov|avi|mkv)$/i.test(fileName);
}

function formatTitle(file) {
    const rawFileName = file.split('/').pop().split('?')[0];
    const isVideo = isVideoFile(rawFileName);
    
    return rawFileName
        .replace(/\.[^/.]+$/, isVideo ? '.mp4' : '.jpg')
        .toLowerCase()
        .replace(/ /g, '_');
}

function formatAlt(file) {
    return file
        .replace(/\.[^/.]+$/, '')
        .replace(/\([^)]*\)|\[[^\]]*\]/g, '')
        .replace(/\d/g, '')
        .replace(/\//g, ' of ')
        .replace(/\s+/g, ' ')
        .trim();
}

// ==========================================
// LIGHTBOX LOGIC
// ==========================================

function openLightbox(file) {
    lightboxMedia.innerHTML = '';
    lightboxTitle.textContent = formatTitle(file);

    if (file.startsWith('http')) {
        const video = document.createElement('video');
        // Zet lage resolutie Cloudinary URL om naar hogere resolutie (w_800)
        video.src = file.replace(/w_\d+,h_\d+,c_[a-z]+,/, 'w_800,q_auto,f_auto/');
        video.autoplay = true;
        video.playsInline = true;
        video.loop = true;
        lightboxMedia.appendChild(video);
    } else {
        const img = document.createElement('img');
        const rawUrl = `${GLOBAL_SETTINGS.githubBaseUrl}${file}`;
        img.src = `https://wsrv.nl/?url=${encodeURIComponent(rawUrl)}&w=800&output=${GLOBAL_SETTINGS.imageFormat}&q=80`;
        img.alt = formatAlt(file);
        lightboxMedia.appendChild(img);
    }
    
    lightbox.showModal();
}

function closeLightbox() {
    lightbox.close();
}

lightbox.addEventListener('close', () => {
    lightboxMedia.innerHTML = '';
});

lightboxClose.addEventListener('click', closeLightbox);

lightbox.addEventListener('click', (e) => {
    if (e.target === lightbox) closeLightbox();
});


// ==========================================
// PHOTO GALLERY
// ==========================================

async function generateMediaLists() {
    try {
        const response = await fetch(GLOBAL_SETTINGS.mediaUrl);
        const files = await response.json();

        const ulPhoto = document.getElementById('list-photo');
        const ulCoverArt = document.getElementById('list-cover-art');
        const ulOverig = document.getElementById('list-overig');

        files.forEach(file => {
            const li = document.createElement('li');
            li.addEventListener('click', () => openLightbox(file));
            
            const img = document.createElement('img');
            const rawUrl = `${GLOBAL_SETTINGS.githubBaseUrl}${file}`;
            
            img.src = `https://wsrv.nl/?url=${encodeURIComponent(rawUrl)}&w=${layout.itemWidth}&output=${GLOBAL_SETTINGS.imageFormat}&q=${GLOBAL_SETTINGS.imageQuality}`;
            img.loading = "lazy"; 
            img.alt = formatAlt(file);

            const titleElement = document.createElement('p');
            titleElement.textContent = formatTitle(file);

            li.appendChild(img);
            li.appendChild(titleElement);

            if (file.startsWith('photo/')) {
                ulPhoto.appendChild(li);
            } else if (file.startsWith('cover art/')) {
                ulCoverArt.appendChild(li);
            } else {
                ulOverig.appendChild(li);
            }
        });

    } catch (error) {
        console.error("Error retrieving images:", error);
    }
}


// ==========================================
// VIDEO GALLERY
// ==========================================

async function generateVideoLists() {
    try {
        const response = await fetch('../videos.json');
        const items = await response.json(); 

        const ulCanvas = document.getElementById('list-video-map1'); 
        const ulClip = document.getElementById('list-video-overig'); 
        const ulVideoOverig = document.getElementById('list-video-map2');

        items.forEach(item => {
            const url = item.url;
            const folder = item.folder || 'overig';

            const li = document.createElement('li');
            li.addEventListener('click', () => openLightbox(url));
            
            const mediaElement = document.createElement('video');
            mediaElement.src = url;
            mediaElement.poster = url.replace('/upload/', '/upload/so_2/').replace(/\.(mp4|webm|mov)$/i, '.jpg');
            mediaElement.loop = true;
            mediaElement.muted = true;
            mediaElement.controls = false;
            mediaElement.setAttribute('muted', ''); 
            mediaElement.setAttribute('playsinline', ''); 
            mediaElement.autoplay = !prefersReducedMotion;

            const titleElement = document.createElement('p');
            titleElement.textContent = formatTitle(url);

            li.appendChild(mediaElement);
            li.appendChild(titleElement);

            if (folder === 'canvas') {
                ulCanvas.appendChild(li);
            } else if (folder === 'clip') {
                ulClip.appendChild(li);
            } else {
                ulVideoOverig.appendChild(li);
            }
        });

    } catch (error) {
        console.error("Error retrieving videos:", error);
    }
}

// ==========================================
// INITIATION
// ==========================================
generateMediaLists();
generateVideoLists();