// Website Made by Bence (bencebarens.nl)

const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const characters = "AaBbCcDdEeFfGgHhIiJjKkLlMmNnOoPpQqRrSsTtUuVvWwXxYyZz!@#$%^&*";

// SCRAMBLE FUNCTIE (Globaal beschikbaar) ///////////////////////////////////////

// Aangepaste scramble functie
function scramble(element, reverse = false) {
    const originalText = element.innerText;
    let iteration = 0;
    
    const interval = setInterval(() => {
        element.innerText = originalText
            .split("")
            .map((letter, index) => {
                if (reverse) {
                    return index < (originalText.length - iteration) 
                        ? originalText[index] 
                        : characters[Math.floor(Math.random() * characters.length)];
                }
                // Normaal proces
                return index < iteration ? originalText[index] : characters[Math.floor(Math.random() * characters.length)];
            })
            .join("");
        
        if (iteration >= originalText.length) clearInterval(interval);
        iteration += 1.5;
    }, 50);
}

// SPLASH SCREEN ////////////////////////////////////////////////////////////////

document.addEventListener('DOMContentLoaded', () => {
    const splash = document.getElementById('splash-screen');
    if (!splash) return;

    if (sessionStorage.getItem('splashShown')) {
        splash.style.display = 'none';
        return;
    }

    const pElement = splash.querySelector('p');

    setTimeout(() => {
        splash.classList.add('fade-in');
        if (pElement) scramble(pElement, false);

        setTimeout(() => {
            if (pElement) scramble(pElement, true);

            splash.classList.add('fade-out');
            
            setTimeout(() => {
                splash.style.display = 'none';
                sessionStorage.setItem('splashShown', 'true');
            }, 500);
        }, 2500);
    }, 500);
});

// VIEW COUNTER /////////////////////////////////////////////////////////////////

const ESTIMATED_DAILY_GROWTH = 50000; 
const STREAMS_PER_MS = ESTIMATED_DAILY_GROWTH / (24 * 60 * 60 * 1000);
const AVG_MS_BETWEEN_STREAMS = (24 * 60 * 60 * 1000) / ESTIMATED_DAILY_GROWTH;

async function loadStreamCounter() {
    const counterElement = document.querySelector('#counter');
    if (!counterElement) return;

    try {
        const response = await fetch('../total-streams.json');
        if (!response.ok) throw new Error(`HTTP fout! Status: ${response.status}`);

        const data = await response.json();
        const baseStreams = data.total_streams;
        const lastUpdatedTime = new Date(data.last_updated).getTime();

        if (!baseStreams || isNaN(lastUpdatedTime)) throw new Error("Ongeldige data in JSON");

        startRealtimeTicking(counterElement, baseStreams, lastUpdatedTime);
    } catch (error) {
        console.error("Kon de realtime streamcount niet laden:", error);
        const wrapper = document.querySelector('#counter-wrapper');
        if (wrapper) wrapper.remove();
    }
}

function startRealtimeTicking(element, baseStreams, lastUpdatedTime) {
    function getCurrentStreams() {
        const now = Date.now();
        const msPassed = Math.max(0, now - lastUpdatedTime);
        const extraStreams = msPassed * STREAMS_PER_MS;
        return Math.floor(baseStreams + extraStreams);
    }

    if (prefersReducedMotion) {
        element.textContent = getCurrentStreams().toLocaleString('nl-NL');
        return;
    }

    let currentDisplayValue = getCurrentStreams();
    animateCounter(element, currentDisplayValue, 1500, () => {
        function tick() {
            const realTimeTarget = getCurrentStreams();
            if (currentDisplayValue < realTimeTarget) {
                const step = Math.min(Math.floor(Math.random() * 3) + 1, realTimeTarget - currentDisplayValue);
                currentDisplayValue += step;
                element.textContent = currentDisplayValue.toLocaleString('nl-NL');
            }
            const randomDelay = Math.random() * (AVG_MS_BETWEEN_STREAMS * 1.9 - AVG_MS_BETWEEN_STREAMS * 0.2) + (AVG_MS_BETWEEN_STREAMS * 0.2);
            setTimeout(tick, randomDelay);
        }
        tick();
    });
}

function animateCounter(element, target, duration, onComplete) {
    let startTimestamp = null;
    const step = (timestamp) => {
        if (!startTimestamp) startTimestamp = timestamp;
        const progress = Math.min((timestamp - startTimestamp) / duration, 1);
        element.textContent = Math.floor(progress * target).toLocaleString('nl-NL');
        if (progress < 1) window.requestAnimationFrame(step);
        else if (onComplete) onComplete();
    };
    window.requestAnimationFrame(step);
}

document.addEventListener('DOMContentLoaded', loadStreamCounter);

// SCRAMBLER VOOR KOPPEN (h1-h6) ////////////////////////////////////////////////

if (!prefersReducedMotion) {
    document.addEventListener("DOMContentLoaded", () => {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    scramble(entry.target);
                    observer.unobserve(entry.target);
                }
            });
        }, { threshold: 0.2 });

        document.querySelectorAll('h1, h2, h3, h4, h5, h6').forEach(heading => {
            observer.observe(heading);
        });
    });
}