// Website Made by Bence (bencebarens.nl)

// ==========================================
// SHARED SETTINGS, HELPERS & LIGHTBOX
// ==========================================

window.GLOBAL_SETTINGS = {
    imageQuality: 70,
    imageFormat: 'webp',
    githubBaseUrl: 'https://raw.githubusercontent.com/BenceBarens/xolunar/main/assets/media/Photo/',
    githubAudioBaseUrl: 'https://raw.githubusercontent.com/BenceBarens/xolunar/main/assets/media/audio/'
};

window.prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

window.isVideoFile = isVideoFile;
window.formatTitle = formatTitle;
window.formatAlt = formatAlt;
window.formatAudioTitle = formatAudioTitle;
window.openLightbox = openLightbox;
window.closeLightbox = closeLightbox;

// Helpers
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

document.addEventListener('DOMContentLoaded', () => {
    const lightbox = document.querySelector('#lightbox');
    const lightboxMedia = document.querySelector('#lightbox-media');
    const lightboxClose = document.querySelector('#lightbox-close');

    if (!lightbox) return;

    lightbox.addEventListener('close', () => {
        const stage = document.querySelector('#carousel-stage');
        if (stage) stage.classList.remove('paused');
        if (lightboxMedia) lightboxMedia.innerHTML = '';
    });

    if (lightboxClose) {
        lightboxClose.addEventListener('click', closeLightbox);
    }

    lightbox.addEventListener('click', (e) => {
        if (e.target === lightbox) closeLightbox();
    });
});