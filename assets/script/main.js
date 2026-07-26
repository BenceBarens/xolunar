// Website Made by Bence (bencebarens.nl)

const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const characters = "AaBbCcDdEeFfGgHhIiJjKkLlMmNnOoPpQqRrSsTtUuVvWwXxYyZz!@#$%^&*";

// SCRAMBLE FUNCTIE (Globaal beschikbaar) ///////////////////////////////////////

function scramble(element, reverse = false) {
    if (element.scrambleInterval) clearInterval(element.scrambleInterval);

    if (!element.dataset.originalText) {
        // 1. Sla originele tekst op
        element.dataset.originalText = element.innerText;
        
        // 2. FIX VOOR LAYOUT SHIFTS
        // Meet de exacte huidige breedte van het element
        const rect = element.getBoundingClientRect();
        
        // Standaard <a> tags zijn 'inline' en negeren breedte-instellingen. 
        // We forceren 'inline-block' zodat we de breedte kunnen vastzetten.
        if (window.getComputedStyle(element).display === 'inline') {
            element.style.display = 'inline-block';
        }
        
        // Zet de breedte vast op de gemeten pixels
        element.style.width = `${rect.width}px`;
        // Voorkom dat willekeurige, bredere tekens de tekst naar een tweede regel drukken (hoogte-shift)
        element.style.whiteSpace = 'nowrap';
        
        // 3. TOEGANKELIJKHEID
        if (!element.hasAttribute('aria-label')) {
            element.setAttribute('aria-label', element.dataset.originalText);
        }
    }
    
    const originalText = element.dataset.originalText;
    let iteration = 0;
    
    element.scrambleInterval = setInterval(() => {
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
        
        if (iteration >= originalText.length) {
            clearInterval(element.scrambleInterval);
            element.innerText = originalText;
        }
        iteration += 3;
    }, 80);
}

// SPLASH SCREEN ////////////////////////////////////////////////////////////////

document.addEventListener('DOMContentLoaded', () => {
    const splash = document.getElementById('splash-screen');
    if (!splash) return;

    if (sessionStorage.getItem('splashShown') || prefersReducedMotion){
        splash.hidden = true;
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
                splash.hidden = true;
                sessionStorage.setItem('splashShown', 'true');
            }, 500);
        }, 2500);
    }, 500);
});

// VIEW COUNTER /////////////////////////////////////////////////////////////////

async function loadStreamCounter() {
    const counterElement = document.querySelector('#counter');
    if (!counterElement) return;

    try {
        const response = await fetch('https://gist.githubusercontent.com/BenceBarens/365bee95e010c8002d93ed1fd440839a/raw/total-streams.json');
        if (!response.ok) throw new Error(`HTTP fout! Status: ${response.status}`);

        const data = await response.json();
        const baseStreams = data.total_streams;
        const lastUpdatedTime = new Date(data.last_updated).getTime();
        const dailyGrowthFactor = data.daily_growth_factor;

        if (!baseStreams || isNaN(lastUpdatedTime)) throw new Error("Ongeldige data in JSON");

        startRealtimeTicking(counterElement, baseStreams, lastUpdatedTime, dailyGrowthFactor);

    } catch (error) {
        console.error("Kon de realtime streamcount niet laden:", error);
        const wrapper = document.querySelector('#counter-wrapper');
        if (wrapper) wrapper.remove();
    }
}

function startRealtimeTicking(element, baseStreams, lastUpdatedTime, dailyGrowthFactor) {
    const estimatedDailyGrowth = baseStreams * (dailyGrowthFactor - 1);

    const streamsPerMs = estimatedDailyGrowth / (24 * 60 * 60 * 1000);
    const avgMsBetweenStreams = (24 * 60 * 60 * 1000) / (estimatedDailyGrowth || 1);

    function getCurrentStreams() {
        const now = Date.now();
        const msPassed = Math.max(0, now - lastUpdatedTime);
        const extraStreams = msPassed * streamsPerMs;
        return Math.floor(baseStreams + extraStreams);
    }

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
        const maxDelay = avgMsBetweenStreams * 3;
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

        document.querySelectorAll('h1, h2, h3, h4, h5, h6, summary').forEach(heading => {
            observer.observe(heading);
        });
    });
}

// SCRAMBLER VOOR LINKS EN KNOPPEN //////////////////////////////////////////////

if (!prefersReducedMotion) {
    document.addEventListener("DOMContentLoaded", () => {
        document.querySelectorAll('a, button').forEach(el => {
            
            el.addEventListener('mouseenter', function() {
                scramble(this);
            });
            
        });
    });
}