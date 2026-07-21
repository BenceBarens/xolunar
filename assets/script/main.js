// Website Made by Bence (bencebarens.nl)

const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const characters = "AaBbCcDdEeFfGgHhIiJjKkLlMmNnOoPpQqRrSsTtUuVvWwXxYyZz!@#$%^&*";

// SCRAMBLE FUNCTIE (Globaal beschikbaar) ///////////////////////////////////////

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
                return index < iteration ? originalText[index] : characters[Math.floor(Math.random() * characters.length)];
            })
            .join("");
        
        if (iteration >= originalText.length) clearInterval(interval);
        iteration += 3;
    }, 80);
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

const DAILY_GROWTH_FACTOR = 1.000688224363364;

async function loadStreamCounter() {
    const counterElement = document.querySelector('#counter');
    if (!counterElement) return;

    try {
        const response = await fetch('https://gist.githubusercontent.com/BenceBarens/365bee95e010c8002d93ed1fd440839a/raw/total-streams.json');
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
    const estimatedDailyGrowth = baseStreams * (DAILY_GROWTH_FACTOR - 1);

    const streamsPerMs = estimatedDailyGrowth / (24 * 60 * 60 * 1000);
    const avgMsBetweenStreams = (24 * 60 * 60 * 1000) / (estimatedDailyGrowth || 1);

    function getCurrentStreams() {
        const now = Date.now();
        const msPassed = Math.max(0, now - lastUpdatedTime);
        const extraStreams = msPassed * streamsPerMs;
        return Math.floor(baseStreams + extraStreams);
    }

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (prefersReducedMotion) {
        element.textContent = getCurrentStreams().toLocaleString('nl-NL');
        return;
    }

    let currentDisplayValue = getCurrentStreams();
    element.textContent = currentDisplayValue.toLocaleString('nl-NL');

    function tick() {
        const realTimeTarget = getCurrentStreams();
        if (currentDisplayValue < realTimeTarget) {
            const step = Math.min(Math.floor(Math.random() * 10) + 1, realTimeTarget - currentDisplayValue);
            currentDisplayValue += step;
            element.textContent = currentDisplayValue.toLocaleString('nl-NL');
        }
        
        const minDelay = avgMsBetweenStreams * 0.1;
        const maxDelay = avgMsBetweenStreams * 2;
        const randomDelay = Math.random() * (maxDelay - minDelay) + minDelay;

        setTimeout(tick, randomDelay);
    }
    
    tick();
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
        }, { threshold: 0.1 });

        document.querySelectorAll('h1, h2, h3, h4, h5, h6').forEach(heading => {
            observer.observe(heading);
        });
    });
}