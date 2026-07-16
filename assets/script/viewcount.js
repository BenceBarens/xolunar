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
  
  function getCurrentStreams() {
    const now = Date.now();
    const msPassed = Math.max(0, now - lastUpdatedTime);
    const extraStreams = msPassed * STREAMS_PER_MS;
    return Math.floor(baseStreams + extraStreams);
  }

  let currentDisplayValue = getCurrentStreams();

  animateCounter(element, currentDisplayValue, 1000, () => {
    
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