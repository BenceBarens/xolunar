// Website Made by Bence (bencebarens.nl)

const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// SPLASH SCREEN ////////////////////////////////////////////////////////////////

document.addEventListener('DOMContentLoaded', () => {
    const splash = document.getElementById('splash-screen');

    // if (sessionStorage.getItem('splashShown')) {
    //     splash.style.display = 'none';
    //     return;
    // }

    setTimeout(() => {
        splash.classList.add('hidden');
        
        setTimeout(() => {
            splash.style.display = 'none';
            sessionStorage.setItem('splashShown', 'true');
        }, 500);
    }, 2500);
});

// VIEW COUNTER /////////////////////////////////////////////////////////////////

const ESTIMATED_DAILY_GROWTH = 50000; 

const STREAMS_PER_MS = ESTIMATED_DAILY_GROWTH / (24 * 60 * 60 * 1000);
const AVG_MS_BETWEEN_STREAMS = (24 * 60 * 60 * 1000) / ESTIMATED_DAILY_GROWTH;

async function loadStreamCounter() {
  const counterElement = document.querySelector('#counter');
  if (!counterElement) return;

  try {
    const response = await fetch('./total-streams.json');
    if (!response.ok) throw new Error(`HTTP fout! Status: ${response.status}`);

    const data = await response.json();
    const baseStreams = data.total_streams;
    const lastUpdatedTime = new Date(data.last_updated).getTime();

    if (!baseStreams || isNaN(lastUpdatedTime)) {
      throw new Error("Ongeldige data in JSON");
    }

    startRealtimeTicking(counterElement, baseStreams, lastUpdatedTime);

  } catch (error) {
    console.error("Kon de realtime streamcount niet laden:", error);
    
    const wrapper = document.querySelector('#counter-wrapper');
    
    if (wrapper) {
      wrapper.remove();
    }
  }
}

function startRealtimeTicking(element, baseStreams, lastUpdatedTime) {
  
  // Berekent de actuele stand op basis van de exacte verstreken tijd
  function getCurrentStreams() {
    const now = Date.now();
    const msPassed = Math.max(0, now - lastUpdatedTime);
    const extraStreams = msPassed * STREAMS_PER_MS;
    return Math.floor(baseStreams + extraStreams);
  }

    if (prefersReducedMotion) {
            const staticValue = getCurrentStreams();
            element.textContent = staticValue.toLocaleString('nl-NL');
            console.log("Reduced motion actief: beginanimatie en live-getik overgeslagen.");
            return;
    }

    let currentDisplayValue = getCurrentStreams();

    animateCounter(element, currentDisplayValue, 1500, () => {
        function tick() {
        const realTimeTarget = getCurrentStreams();

        if (currentDisplayValue < realTimeTarget) {
            const step = Math.min(
            Math.floor(Math.random() * 3) + 1, 
            realTimeTarget - currentDisplayValue
            );
            currentDisplayValue += step;
            element.textContent = currentDisplayValue.toLocaleString('nl-NL');
        }

        const minDelay = AVG_MS_BETWEEN_STREAMS * 0.2;
        const maxDelay = AVG_MS_BETWEEN_STREAMS * 1.9;
        const randomDelay = Math.random() * (maxDelay - minDelay) + minDelay;

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
    const currentValue = Math.floor(progress * target);
    
    element.textContent = currentValue.toLocaleString('nl-NL');

    if (progress < 1) {
      window.requestAnimationFrame(step);
    } else if (onComplete) {
      onComplete();
    }
  };
  
  window.requestAnimationFrame(step);
}

document.addEventListener('DOMContentLoaded', loadStreamCounter);

// SCRAMBLER ///////////////////////////////////////////////////////////////////

if (!prefersReducedMotion) {
    document.addEventListener("DOMContentLoaded", () => {
    const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890!@#$%^&*";
    
    const scramble = (element) => {
        const originalText = element.innerText;
        let iteration = 0;
        
        const interval = setInterval(() => {
        element.innerText = originalText
            .split("")
            .map((letter, index) => {
            if (index < iteration) return originalText[index];
            return characters[Math.floor(Math.random() * characters.length)];
            })
            .join("");
        
        if (iteration >= originalText.length) clearInterval(interval);
        iteration += 1.5;
        }, 50);
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
        if (entry.isIntersecting) {
            scramble(entry.target);
            observer.unobserve(entry.target);
        }
        });
    }, { threshold: 0.2 });

    document.querySelectorAll('h1, h2, h3, h4, h5, h6, #splash-screen p').forEach(heading => {
        observer.observe(heading);
    });
    });
}