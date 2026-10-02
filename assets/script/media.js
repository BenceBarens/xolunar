// Website Made by Bence (bencebarens.nl)

// ==========================================
// SHARED SETTINGS, HELPERS & LIGHTBOX
// ==========================================

window.GLOBAL_SETTINGS = {
    imageQuality: 70,
    imageFormat: 'webp',
    githubBaseUrl: 'https://raw.githubusercontent.com/BenceBarens/xolunar/main/assets/media/Photo/',
    githubAudioBaseUrl: 'https://raw.githubusercontent.com/BenceBarens/xolunar/main/assets/media/audio/',
    r2BaseUrl: 'https://pub-471595993fd34e81935d15516e5468c5.r2.dev'
};

window.prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

window.isVideoFile = isVideoFile;
window.formatTitle = formatTitle;
window.formatAlt = formatAlt;
window.formatAudioTitle = formatAudioTitle;
window.openLightbox = openLightbox;
window.closeLightbox = closeLightbox;

function isVideoFile(fileName) {
    return /\.(mp4|webm|mov|avi|mkv)$/i.test(fileName);
}

function formatTitle(file) {
    const rawFileName = (typeof file === 'string' ? file : (file.original || '')).split('/').pop().split('?')[0];
    const isVideo = isVideoFile(rawFileName);
    return decodeURIComponent(rawFileName)
        .replace(/\.[^/.]+$/, isVideo ? '.mp4' : '.jpg')
        .toLowerCase()
        .replace(/ /g, '_');
}

function formatAlt(file) {
    const raw = typeof file === 'string' ? file : (file.original || '');
    return decodeURIComponent(raw)
        .replace(/\.[^/.]+$/, '')
        .replace(/\([^)]*\)|\[[^\]]*\]/g, '')
        .replace(/\d/g, '')
        .replace(/_/g, ' ')
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

function openLightbox(file, sourceMediaElement) {
    const stage = document.querySelector('#carousel-stage');
    if (stage) stage.classList.add('paused');

    const lightbox = document.querySelector('#lightbox');
    const lightboxMedia = document.querySelector('#lightbox-media');
    const lightboxTitle = document.querySelector('#lightbox-title');

    lightboxMedia.innerHTML = '';
    lightboxTitle.textContent = formatTitle(file);

    const isVideo = typeof file === 'object' || (typeof file === 'string' && file.startsWith('http'));
    const videoUrl = typeof file === 'object' ? file.original : file;

    if (sourceMediaElement) {
        const placeholder = sourceMediaElement.cloneNode(true);
        placeholder.className = 'media-placeholder';
        placeholder.removeAttribute('style');

        if (isVideo) {
            placeholder.muted = true;
            placeholder.setAttribute('playsinline', '');
            placeholder.setAttribute('webkit-playsinline', '');
            placeholder.removeAttribute('autoplay');
            placeholder.pause?.();
        }
        lightboxMedia.appendChild(placeholder);
    }

    if (isVideo) {
        const video = document.createElement('video');
        video.className = 'media-full';

        video.playsInline = true;
        video.setAttribute('playsinline', '');
        video.setAttribute('webkit-playsinline', '');
        
        video.muted = false;
        video.defaultMuted = false;
        video.loop = true;
        video.src = videoUrl;

        video.addEventListener('canplay', () => {
            video.classList.add('is-loaded');
            const ph = lightboxMedia.querySelector('.media-placeholder');
            if (ph) ph.style.opacity = '0';
        }, { once: true });

        const playPromise = video.play();
        if (playPromise !== undefined) {
            playPromise.catch(() => {
                video.muted = true;
                video.play();
            });
        }

        lightboxMedia.appendChild(video);
    } else {
        const img = document.createElement('img');
        img.className = 'media-full';
        img.alt = formatAlt(file);
        const rawUrl = `${window.GLOBAL_SETTINGS.githubBaseUrl}${file}`;
        img.src = `https://wsrv.nl/?url=${encodeURIComponent(rawUrl)}&w=800&output=${window.GLOBAL_SETTINGS.imageFormat}&q=80`;

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
    const lightbox = document.querySelector('#lightbox');
    if (lightbox) lightbox.close();
}

document.addEventListener('DOMContentLoaded', () => {
    const lightbox = document.querySelector('#lightbox');
    const lightboxMedia = document.querySelector('#lightbox-media');
    const lightboxClose = document.querySelector('#lightbox-close');

    if (!lightbox) return;

    lightbox.addEventListener('close', () => {
        const stage = document.querySelector('#carousel-stage');
        if (stage) stage.classList.remove('paused');

        if (lightboxMedia) {
            const activeVideo = lightboxMedia.querySelector('video');
            if (activeVideo) {
                activeVideo.pause();
                activeVideo.src = '';
                activeVideo.load();
            }
            lightboxMedia.innerHTML = '';
        }
    });

    if (lightboxClose) {
        lightboxClose.addEventListener('click', closeLightbox);
    }

    lightbox.addEventListener('click', (e) => {
        if (e.target === lightbox) closeLightbox();
    });
});
