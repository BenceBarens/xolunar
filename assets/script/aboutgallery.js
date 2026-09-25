// Website Made by Bence (bencebarens.nl)

// ==========================================
// ABOUT GALLERY (CAROUSEL)
// ==========================================

const MEDIA_URL = './media.json';
const VIDEOS_URL = './videos.json';

let mediaItems = [];
let currentLayoutId = '';

const stage = document.querySelector('#carousel-stage');
const portfolioSection = document.querySelector('#portfolio');

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
            fetch(MEDIA_URL),
            fetch(VIDEOS_URL)
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
        mediaElement = document.createElement('video');
        const squareVideoUrl = file.includes('/upload/') 
            ? file.replace('/upload/', `/upload/w_${layout.itemSize},h_${layout.itemSize},c_fill,g_auto/`)
            : file;

        mediaElement.muted = true;
        mediaElement.defaultMuted = true;
        mediaElement.playsInline = true;
        mediaElement.setAttribute('muted', '');
        mediaElement.setAttribute('playsinline', '');
        mediaElement.setAttribute('webkit-playsinline', '');
        mediaElement.loop = true;
        mediaElement.controls = false;

        mediaElement.src = squareVideoUrl;
        mediaElement.poster = file.replace('/upload/', '/upload/so_2/').replace(/\.(mp4|webm|mov)$/i, '.jpg');

        if (!prefersReducedMotion) {
            mediaElement.autoplay = true;
            const playPromise = mediaElement.play();
            if (playPromise !== undefined) {
                playPromise.catch(() => {
                    console.log("Playback blocked")
                });
            }
        }
    } else {
        mediaElement = document.createElement('img');
        const rawUrl = `${window.GLOBAL_SETTINGS.githubBaseUrl}${file}`;
        mediaElement.src = `https://wsrv.nl/?url=${encodeURIComponent(rawUrl)}&w=${layout.itemSize}&h=${layout.itemSize}&fit=cover&output=${window.GLOBAL_SETTINGS.imageFormat}&q=${window.GLOBAL_SETTINGS.imageQuality}`;
        mediaElement.alt = `Portfolio: ${formatAlt(file)}`;
    }
    return mediaElement;
}

function setupCarousel() {
    if (!stage || mediaItems.length === 0) return;
    
    const prefersReducedMotion = window.prefersReducedMotion;
    stage.innerHTML = '';

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

let resizeTimer;
window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
        const newLayout = getLayoutSettings();
        if (newLayout.id !== currentLayoutId) setupCarousel();
    }, 200);
});

let isScrolling = false;
if (portfolioSection) {
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
}

loadMedia();