// Website Made by Bence (bencebarens.nl)

// === JOUW CONTROLEPANEEL ===
const SETTINGS = {
    mediaUrl: './media.json',
    
    // Layout
    rings: 3,               // Hoeveel ringen wil je op elkaar stapelen?
    slotsPerRing: 20,       // Hoeveel afbeeldingen passen er in één cirkel?
    ringSpacing: 300,       // De verticale afstand tussen de ringen (in pixels)
    
    // Afbeeldingen
    itemWidth: 200,         // De breedte van de afbeelding (in pixels)
    itemHeight: 200,        // De hoogte van de afbeelding (in pixels)
    
    // Kwaliteit (voor de wsrv.nl image proxy)
    imageQuality: 60,
    imageFormat: 'webp'
};
// ============================

let mediaItems = [];

async function loadMedia() {
    try {
        const response = await fetch(SETTINGS.mediaUrl);
        mediaItems = await response.json();
        
        // Start het bouwen van de carousel
        setupCarousel();
    } catch (error) {
        console.error("Fout bij het laden van media:", error);
    }
}

function setupCarousel() {
    const stage = document.querySelector('#carousel-stage');
    stage.innerHTML = ''; // Maak de stage schoon
    
    if (mediaItems.length === 0) return;

    // Geef de maten door aan CSS via variabelen
    stage.style.setProperty('--item-width', `${SETTINGS.itemWidth}px`);
    stage.style.setProperty('--item-height', `${SETTINGS.itemHeight}px`);

    const startOffset = -((SETTINGS.rings - 1) / 2) * SETTINGS.ringSpacing;

    let globalMediaIndex = 0;

    for (let r = 0; r < SETTINGS.rings; r++) {
        const ringEl = document.createElement('ul');
        ringEl.className = 'ring';
        
        // Bereken de verticale positie van deze specifieke ring
        const currentOffset = startOffset + (r * SETTINGS.ringSpacing);
        ringEl.style.setProperty('--row-offset', `${currentOffset}px`);

        // Vul de ring met afbeeldingen
        for (let s = 0; s < SETTINGS.slotsPerRing; s++) {
            const li = document.createElement('li');
            li.style.setProperty('--slot', s);
            
            // Pak de volgende afbeelding en zorg dat we weer bij 0 beginnen als de lijst op is
            const file = mediaItems[globalMediaIndex % mediaItems.length];
            globalMediaIndex++;

            const img = document.createElement('img');
            const title = document.createElement('span');
            title.className = 'photo-title';

            const rawUrl = `https://raw.githubusercontent.com/BenceBarens/xolunar/main/assets/img/Photo/${file}`;
            
            // Vraag exact het formaat op dat je bij SETTINGS hebt ingesteld
            img.src = `https://wsrv.nl/?url=${encodeURIComponent(rawUrl)}&w=${SETTINGS.itemWidth}&output=${SETTINGS.imageFormat}&q=${SETTINGS.imageQuality}`;
            img.alt = `Portfolio: ${file}`;
            title.textContent = file.split('/').pop();

            li.appendChild(img);
            li.appendChild(title);
            ringEl.appendChild(li);
        }

        stage.appendChild(ringEl);
    }

    updateGeometry();
}

function updateGeometry() {
    const stage = document.querySelector('#carousel-stage');
    
    const angle = 360 / SETTINGS.slotsPerRing;
    
    // We tellen wat pixels op bij de breedte (bijv. 40px gap) zodat ze niet strak tegen elkaar plakken
    const itemSpacing = SETTINGS.itemWidth + 40; 
    
    // Wiskundige berekening om de perfecte cirkel-straal te maken op basis van het aantal items
    const radius = Math.round((itemSpacing / 2) / Math.tan(Math.PI / SETTINGS.slotsPerRing));

    stage.style.setProperty('--angle', `${angle}deg`);
    stage.style.setProperty('--radius', `${radius}px`);
}

// Zorg dat de carousel meeschaalt als je het venster aanpast
window.addEventListener('resize', () => {
    // Alleen opnieuw renderen als je op desktop resize events wilt afvangen.
    // Voor puur CSS scaling is dit niet per se nodig, maar het houdt de geometrie strak.
});

loadMedia();