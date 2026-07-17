// Website Made by Bence (bencebarens.nl)

const GLOBAL_SETTINGS = {
    mediaUrl: './media.json',
    imageQuality: 60,
    imageFormat: 'webp'
};

let mediaItems = [];
let currentLayoutId = ''; // Houdt bij welke schermgrootte we momenteel gebruiken

// === JOUW RESPONSIVE CONTROLEPANEEL ===
function getLayoutSettings() {
    const width = window.innerWidth;
    
    if (width < 600) {
        return {
            id: 'mobile',
            rings: 4,
            slotsPerRing: 16, // Kleinere ring voor kleine schermen
            ringSpacing: 180,
            itemWidth: 100,
            itemHeight: 120
        };
    } else if (width < 900) {
        return {
            id: 'tablet',
            rings: 3,
            slotsPerRing: 16,
            ringSpacing: 240,
            itemWidth: 140,
            itemHeight: 160
        };
    } else if (width < 1600) {
        return {
            id: 'desktop',
            rings: 3,
            slotsPerRing: 20,
            ringSpacing: 300,
            itemWidth: 200,
            itemHeight: 200
        };
    } else {
        // Ultrawide monitoren (>1700px) - Voorkomt de lelijke randen!
        return {
            id: 'ultrawide',
            rings: 3,
            slotsPerRing: 32, // Extra veel slots trekt de cilinder breder dan het scherm
            ringSpacing: 350,
            itemWidth: 240, 
            itemHeight: 240
        };
    }
}
// =======================================

async function loadMedia() {
    try {
        const response = await fetch(GLOBAL_SETTINGS.mediaUrl);
        mediaItems = await response.json();
        
        setupCarousel();
    } catch (error) {
        console.error("Fout bij het laden van media:", error);
    }
}

function setupCarousel() {
    const stage = document.querySelector('#carousel-stage');
    stage.innerHTML = ''; 
    
    if (mediaItems.length === 0) return;

    // Haal de perfecte instellingen voor dit schermformaat op
    const layout = getLayoutSettings();
    currentLayoutId = layout.id; 

    // Geef de maten door aan CSS via variabelen
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

            const img = document.createElement('img');
            const title = document.createElement('span');
            title.className = 'photo-title';

            const rawUrl = `https://raw.githubusercontent.com/BenceBarens/xolunar/main/assets/img/Photo/${file}`;
            
            // Mooi detail: Mobiel laadt nu ook automatisch kleinere bestanden in!
            img.src = `https://wsrv.nl/?url=${encodeURIComponent(rawUrl)}&w=${layout.itemWidth}&output=${GLOBAL_SETTINGS.imageFormat}&q=${GLOBAL_SETTINGS.imageQuality}`;
            img.alt = `Portfolio: ${file}`;
            title.textContent = file.split('/').pop();

            li.appendChild(img);
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

// Slimme event listener die alleen herbouwt als we van 'categorie' wisselen
let resizeTimer;
window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
        const newLayout = getLayoutSettings();
        if (newLayout.id !== currentLayoutId) {
            setupCarousel();
        }
    }, 200); // 200ms wachten tot je stopt met slepen van het venster
});

loadMedia();