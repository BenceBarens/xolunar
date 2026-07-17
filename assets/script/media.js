// Website Made by Bence (bencebarens.nl)

const GLOBAL_SETTINGS = {
    mediaUrl: './media.json',
    videosUrl: './videos.json',
    imageQuality: 60,
    imageFormat: 'webp',
    githubBaseUrl: 'https://raw.githubusercontent.com/BenceBarens/xolunar/main/assets/img/Photo/'
};

let mediaItems = [];
let currentLayoutId = '';

function getLayoutSettings() {
    const width = window.innerWidth;
    
    if (width < 600) {
        return { id: 'mobile', rings: 4, slotsPerRing: 16, ringSpacing: 180, itemWidth: 100, itemHeight: 120 };
    } else if (width < 900) {
        return { id: 'tablet', rings: 3, slotsPerRing: 16, ringSpacing: 240, itemWidth: 140, itemHeight: 160 };
    } else if (width < 1600) {
        return { id: 'desktop', rings: 3, slotsPerRing: 20, ringSpacing: 300, itemWidth: 200, itemHeight: 200 };
    } else {
        return { id: 'ultrawide', rings: 3, slotsPerRing: 32, ringSpacing: 350, itemWidth: 240, itemHeight: 240 };
    }
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

function setupCarousel() {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const stage = document.querySelector('#carousel-stage');
    
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
        
        const currentOffset = startOffset + (r * layout.ringSpacing);
        ringEl.style.setProperty('--row-offset', `${currentOffset}px`);

        for (let s = 0; s < layout.slotsPerRing; s++) {
            const li = document.createElement('li');
            li.style.setProperty('--slot', s);
            
            const file = mediaItems[globalMediaIndex % mediaItems.length];
            globalMediaIndex++;

            let mediaElement;

            if (file.startsWith('http')) {
                mediaElement = document.createElement('video');
                mediaElement.src = file;
                
                const posterUrl = file
                    .replace('/upload/', '/upload/so_2/') 
                    .replace(/\.(mp4|webm|mov)$/i, '.jpg');
                
                mediaElement.poster = posterUrl;
                mediaElement.loop = true;
                mediaElement.muted = true;
                mediaElement.controls = false;
                mediaElement.setAttribute('muted', ''); 
                mediaElement.setAttribute('playsinline', ''); 
                mediaElement.autoplay = !prefersReducedMotion;
                
            } else {
                // Lokale GitHub Foto via wsrv.nl
                mediaElement = document.createElement('img');
                const rawUrl = `${GLOBAL_SETTINGS.githubBaseUrl}${file}`;
                mediaElement.src = `https://wsrv.nl/?url=${encodeURIComponent(rawUrl)}&w=${layout.itemWidth}&output=${GLOBAL_SETTINGS.imageFormat}&q=${GLOBAL_SETTINGS.imageQuality}`;
                mediaElement.alt = `Portfolio: ${file}`;
            }

            const title = document.createElement('span');
            title.className = 'photo-title';
            title.textContent = file.split('/').pop().split('?')[0]; 

            li.appendChild(mediaElement);
            li.appendChild(title);
            ringEl.appendChild(li);
        }

        stage.appendChild(ringEl);
    }

    updateGeometry(layout);
}

function updateGeometry(layout) {
    const stage = document.querySelector('#carousel-stage');
    const angle = 360 / layout.slotsPerRing;
    const itemSpacing = layout.itemWidth + 40; 
    const radius = Math.round((itemSpacing / 2) / Math.tan(Math.PI / layout.slotsPerRing));

    stage.style.setProperty('--angle', `${angle}deg`);
    stage.style.setProperty('--radius', `${radius}px`);
}

let resizeTimer;
window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
        const newLayout = getLayoutSettings();
        if (newLayout.id !== currentLayoutId) {
            setupCarousel();
        }
    }, 200);
});

loadMedia();