// Website Made by Bence (bencebarens.nl)

// ==========================================
// SETTINGS & GLOBALS
// ==========================================
const GLOBAL_SETTINGS = {
    mediaUrl: './media.json',
    videosUrl: './videos.json',
    imageQuality: 60,
    imageFormat: 'webp',
    githubBaseUrl: 'https://raw.githubusercontent.com/BenceBarens/xolunar/main/assets/media/Photo/'
};

let mediaItems = [];
let currentLayoutId = '';

// DOM
const stage = document.querySelector('#carousel-stage');
const portfolioSection = document.querySelector('#portfolio');
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
        .replace(/_/g, ' ')
        .replace(/\//g, ' of ')
        .replace(/\s+/g, ' ')
        .trim();
}


// ==========================================
// CAROUSEL
// ==========================================
function getLayoutSettings() {
    const width = window.innerWidth;
    if (width < 600) return { id: 'mobile', rings: 3, slotsPerRing: 16, itemSize: 120 };
    if (width < 900) return { id: 'tablet', rings: 3, slotsPerRing: 16, itemSize: 140 };
    if (width < 1600) return { id: 'desktop', rings: 3, slotsPerRing: 20, itemSize: 180 };
    return { id: 'ultrawide', rings: 3, slotsPerRing: 32, itemSize: 240 };
}

async function loadMedia() {
    try {
        const [photoResponse, videoResponse] = await Promise.all([
            fetch(GLOBAL_SETTINGS.mediaUrl),
            fetch(GLOBAL_SETTINGS.videosUrl)
        ]);
        
        const photos = await photoResponse.json();
        const videos = await videoResponse.json();
        
        const canvasVideos = videos
            .filter(item => item.folder === 'canvas')
            .map(item => item.url);
        
        mediaItems = [...photos, ...canvasVideos].sort(() => Math.random() - 0.5);
        setupCarousel();
    } catch (error) {
        console.error("Fout bij het laden van media:", error);
    }
}

function createMediaElement(file, layout, prefersReducedMotion) {
    let mediaElement;

    if (file.startsWith('http')) {
        // Video config
        mediaElement = document.createElement('video');
        mediaElement.src = file;
        mediaElement.poster = file.replace('/upload/', '/upload/so_2/').replace(/\.(mp4|webm|mov)$/i, '.jpg');
        mediaElement.loop = true;
        mediaElement.muted = true;
        mediaElement.controls = false;
        mediaElement.setAttribute('muted', ''); 
        mediaElement.setAttribute('playsinline', ''); 
        mediaElement.autoplay = !prefersReducedMotion;
    } else {
        // Foto config
        mediaElement = document.createElement('img');
        const rawUrl = `${GLOBAL_SETTINGS.githubBaseUrl}${file}`;
        mediaElement.src = `https://wsrv.nl/?url=${encodeURIComponent(rawUrl)}&w=${layout.itemSize}&h=${layout.itemSize}&fit=cover&output=${GLOBAL_SETTINGS.imageFormat}&q=${GLOBAL_SETTINGS.imageQuality}`;
        mediaElement.alt = `Portfolio: ${formatAlt(file)}`;
    }
    return mediaElement;
}

function setupCarousel() {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    stage.innerHTML = ''; 
    if (mediaItems.length === 0) return;

    const layout = getLayoutSettings();
    currentLayoutId = layout.id; 

    stage.style.setProperty('--item-size', `${layout.itemSize}px`);

    const itemSpacing = layout.itemSize + 40; 
    const startOffset = -((layout.rings - 1) / 2) * itemSpacing;
    
    let globalMediaIndex = 0;

    for (let r = 0; r < layout.rings; r++) {
        const ringEl = document.createElement('ul');
        ringEl.className = 'ring';
        ringEl.style.setProperty('--row-offset', `${startOffset + (r * itemSpacing)}px`);

        for (let s = 0; s < layout.slotsPerRing; s++) {
            const li = document.createElement('li');
            li.style.setProperty('--slot', s);
            li.style.cursor = 'pointer'; 
            
            const file = mediaItems[globalMediaIndex % mediaItems.length];
            globalMediaIndex++;

            const mediaElement = createMediaElement(file, layout, prefersReducedMotion);
            li.addEventListener('click', () => openLightbox(file, mediaElement));

            li.appendChild(mediaElement);
            ringEl.appendChild(li);
        }
        stage.appendChild(ringEl);
    }
    updateGeometry(layout);
}

function updateGeometry(layout) {
    const angle = 360 / layout.slotsPerRing;
    const itemSpacing = layout.itemSize + 40; 
    const radius = Math.round((itemSpacing / 2) / Math.tan(Math.PI / layout.slotsPerRing));

    stage.style.setProperty('--angle', `${angle}deg`);
    stage.style.setProperty('--radius', `${radius}px`);
}


// ==========================================
// EVENT LISTENERS & ANIMATIONS
// ==========================================

let resizeTimer;
window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
        const newLayout = getLayoutSettings();
        if (newLayout.id !== currentLayoutId) setupCarousel();
    }, 200);
});

let isScrolling = false;
window.addEventListener('scroll', () => {
    if (!isScrolling) {
        window.requestAnimationFrame(() => {
            const progress = Math.max(0, Math.min(1, window.scrollY / 350));
            const currentOpacity = 1 - progress;
            
            portfolioSection.style.opacity = currentOpacity;
            portfolioSection.style.transform = `translateY(${progress * -10}em)`;
            
            if (currentOpacity < 0.5) {
                portfolioSection.classList.add('no-clicks');
            } else {
                portfolioSection.classList.remove('no-clicks');
            }
            
            isScrolling = false;
        });
        isScrolling = true;
    }
}, { passive: true });


// ==========================================
// LIGHTBOX
// ==========================================
function openLightbox(file, sourceMediaElement) {
    stage.classList.add('paused');
    lightboxMedia.innerHTML = '';
    lightboxTitle.textContent = formatTitle(file);

    const isVideo = file.startsWith('http');

    if (sourceMediaElement) {
        const placeholder = sourceMediaElement.cloneNode(true);
        placeholder.className = 'media-placeholder';
        placeholder.removeAttribute('style');

        if (isVideo) {
            placeholder.muted = true;
            placeholder.removeAttribute('autoplay');
            placeholder.pause?.();
        }
        lightboxMedia.appendChild(placeholder);
    }

    if (isVideo) {
        const video = document.createElement('video');
        video.className = 'media-full';
        video.src = file.replace(/w_\d+,h_\d+,c_[a-z]+,/, 'w_800,q_auto,f_auto/');
        video.autoplay = true;
        video.playsInline = true;
        video.loop = true;

        video.addEventListener('canplay', () => {
            video.classList.add('is-loaded');
            const ph = lightboxMedia.querySelector('.media-placeholder');
            if (ph) ph.style.opacity = '0';
        }, { once: true });

        lightboxMedia.appendChild(video);
    } else {
        const img = document.createElement('img');
        img.className = 'media-full';
        img.alt = formatAlt(file);
        const rawUrl = `${GLOBAL_SETTINGS.githubBaseUrl}${file}`;
        img.src = `https://wsrv.nl/?url=${encodeURIComponent(rawUrl)}&w=800&output=${GLOBAL_SETTINGS.imageFormat}&q=80`;

        const onLoaded = () => {
            img.classList.add('is-loaded');
            const ph = lightboxMedia.querySelector('.media-placeholder');
            if (ph) ph.style.opacity = '0';
        };

        if (img.complete) {
            onLoaded();
        } else {
            img.addEventListener('load', onLoaded, { once: true });
        }

        lightboxMedia.appendChild(img);
    }
    lightbox.showModal();
}

function closeLightbox() {
    lightbox.close();
}

lightbox.addEventListener('close', () => {
    stage.classList.remove('paused');
    lightboxMedia.innerHTML = '';
});

lightboxClose.addEventListener('click', closeLightbox);
lightbox.addEventListener('click', (e) => {
    if (e.target === lightbox) closeLightbox();
});


// ==========================================
// 6. INITIATION
// ==========================================
loadMedia();