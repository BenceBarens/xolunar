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
// GALLERY
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
        console.error("Fout bij het ophalen van de media:", error);
    }
}

generateMediaLists();