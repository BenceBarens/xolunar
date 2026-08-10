// Website Made by Bence (bencebarens.nl)

// ==========================================
// SETTINGS & GLOBALS
// ==========================================

const GLOBAL_SETTINGS = {
    mediaUrl: '../media.json',
    audioUrl: '../audio.json',
    imageQuality: 80,
    imageFormat: 'webp',
    githubBaseUrl: 'https://raw.githubusercontent.com/BenceBarens/xolunar/main/assets/media/Photo/',
    githubAudioBaseUrl: 'https://raw.githubusercontent.com/BenceBarens/xolunar/main/assets/media/audio/'
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

function formatAudioTitle(file) {
    let name = file.split('/').pop();
    name = name.replace(/\.(mp3|wav|ogg|m4a|flac)$/i, '.mp3');
    name = name.replace(/_/g, ' ');
    return name;
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
// AUDIO GALLERY
// ==========================================

function formatTime(seconds) {
    if (isNaN(seconds)) return "0:00";
    const min = Math.floor(seconds / 60);
    const sec = Math.floor(seconds % 60);
    return `${min}:${sec < 10 ? '0' : ''}${sec}`;
}

async function generateAudioLists() {
    try {
        const response = await fetch(GLOBAL_SETTINGS.audioUrl);
        const files = await response.json();

        const ulInstrumentals = document.getElementById('list-audio-instrumentals');
        const ulBeats = document.getElementById('list-audio-beats');
        const ulOverig = document.getElementById('list-audio-overig');

        files.forEach(file => {
            const li = document.createElement('li');
            li.className = 'audio-item';
            
            const titleElement = document.createElement('p');
            titleElement.className = 'audio-title';
            titleElement.textContent = formatAudioTitle(file);

            const audioElement = document.createElement('audio');
            audioElement.preload = 'metadata';
            audioElement.src = `${GLOBAL_SETTINGS.githubAudioBaseUrl}${file}`;

            const customPlayer = document.createElement('div');

            const playBtn = document.createElement('button');
            playBtn.className = 'play-btn';
            playBtn.textContent = 'Play';

            const progressBar = document.createElement('input');
            progressBar.type = 'range';
            progressBar.className = 'progress-bar';
            progressBar.value = 0;
            progressBar.min = 0;
            progressBar.step = 0.1;

            customPlayer.appendChild(playBtn);
            customPlayer.appendChild(progressBar);

            const docFrame = document.createElement('div');
            docFrame.className = 'document-frame';
            
            docFrame.insertAdjacentHTML('afterbegin', '<span class="music-icon">&#9835; </span>');

            const timeDisplay = document.createElement('span');
            timeDisplay.className = 'time-display';
            timeDisplay.textContent = '0:00 / 0:00';
            
            docFrame.appendChild(timeDisplay);

            li.appendChild(docFrame);
            li.appendChild(titleElement);
            li.appendChild(audioElement);
            li.appendChild(customPlayer);

            // --- EVENT LISTENERS VOOR DE CONTROLS ---

            playBtn.addEventListener('click', () => {
                if (audioElement.paused) {
                    audioElement.play();
                } else {
                    audioElement.pause();
                }
            });

            audioElement.addEventListener('play', () => {
                playBtn.textContent = 'Pause';
            });

            audioElement.addEventListener('pause', () => {
                playBtn.textContent = 'Play';
            });

            audioElement.addEventListener('loadedmetadata', () => {
                progressBar.max = audioElement.duration;
                timeDisplay.textContent = `0:00 / ${formatTime(audioElement.duration)}`;
            });

            audioElement.addEventListener('timeupdate', () => {
                progressBar.value = audioElement.currentTime;
                timeDisplay.textContent = `${formatTime(audioElement.currentTime)} / ${formatTime(audioElement.duration)}`;
            });

            progressBar.addEventListener('input', () => {
                audioElement.currentTime = progressBar.value;
            });

            audioElement.addEventListener('ended', () => {
                playBtn.textContent = 'Play';
                progressBar.value = 0;
                audioElement.currentTime = 0;
            });

            if (file.startsWith('instrumentals/')) {
                if(ulInstrumentals) ulInstrumentals.appendChild(li);
            } else if (file.startsWith('beats/')) {
                if(ulBeats) ulBeats.appendChild(li);
            } else {
                if(ulOverig) ulOverig.appendChild(li);
            }
        });

    } catch (error) {
        console.error("Fout bij het ophalen van audio:", error);
    }
}

document.addEventListener('play', function(e) {
    if (e.target.tagName === 'AUDIO') {
        const audios = document.getElementsByTagName('audio');
        for (let i = 0, len = audios.length; i < len; i++) {
            if (audios[i] !== e.target) {
                audios[i].pause();
            }
        }
    }
}, true);

// ==========================================
// INITIATION
// ==========================================
generateMediaLists();
generateVideoLists();
generateAudioLists();