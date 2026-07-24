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
        .replace(/\//g, ' of ')
        .replace(/\s+/g, ' ')
        .trim();
}


// ==========================================
// CAROUSEL
// ==========================================
function getLayoutSettings() {
    const width = window.innerWidth;
    if (width < 600) return { id: 'mobile', rings: 3, slotsPerRing: 16, ringSpacing: 180, itemWidth: 100, itemHeight: 120 };
    if (width < 900) return { id: 'tablet', rings: 3, slotsPerRing: 16, ringSpacing: 240, itemWidth: 140, itemHeight: 160 };
    if (width < 1600) return { id: 'desktop', rings: 3, slotsPerRing: 20, ringSpacing: 300, itemWidth: 200, itemHeight: 200 };
    return { id: 'ultrawide', rings: 3, slotsPerRing: 32, ringSpacing: 350, itemWidth: 240, itemHeight: 240 };
}

async function loadMedia() {
    try {
        const [photoResponse, videoResponse] = await Promise.all([
            fetch(GLOBAL_SETTINGS.mediaUrl),
            fetch(GLOBAL_SETTINGS.videosUrl)
        ]);
        
        const photos = await photoResponse.json();
        const videos = await videoResponse.json();
        
        mediaItems = [...photos, ...videos].sort(() => Math.random() - 0.5);
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
        mediaElement.src = `https://wsrv.nl/?url=${encodeURIComponent(rawUrl)}&w=${layout.itemWidth}&output=${GLOBAL_SETTINGS.imageFormat}&q=${GLOBAL_SETTINGS.imageQuality}`;
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

    stage.style.setProperty('--item-width', `${layout.itemWidth}px`);
    stage.style.setProperty('--item-height', `${layout.itemHeight}px`);

    const startOffset = -((layout.rings - 1) / 2) * layout.ringSpacing;
    let globalMediaIndex = 0;

    for (let r = 0; r < layout.rings; r++) {
        const ringEl = document.createElement('ul');
        ringEl.className = 'ring';
        ringEl.style.setProperty('--row-offset', `${startOffset + (r * layout.ringSpacing)}px`);

        for (let s = 0; s < layout.slotsPerRing; s++) {
            const li = document.createElement('li');
            li.style.setProperty('--slot', s);
            li.style.cursor = 'pointer'; 
            
            const file = mediaItems[globalMediaIndex % mediaItems.length];
            globalMediaIndex++;

            const mediaElement = createMediaElement(file, layout, prefersReducedMotion);
            li.addEventListener('click', () => openLightbox(file));

            const title = document.createElement('span');
            title.className = 'photo-title';
            title.textContent = formatTitle(file);

            li.appendChild(mediaElement);
            li.appendChild(title);
            ringEl.appendChild(li);
        }
        stage.appendChild(ringEl);
    }
    updateGeometry(layout);
}

function updateGeometry(layout) {
    const angle = 360 / layout.slotsPerRing;
    const itemSpacing = layout.itemWidth + 40; 
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
function openLightbox(file) {
    stage.classList.add('paused');
    lightboxMedia.innerHTML = '';
    lightboxTitle.textContent = formatTitle(file);

    if (file.startsWith('http')) {
        const video = document.createElement('video');
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