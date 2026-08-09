// Website Made by Bence (bencebarens.nl)

const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const hasHoverSupport = window.matchMedia('(hover: hover)').matches;
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

        document.querySelectorAll('h1.scramble, h2.scramble, h3.scramble, h4.scramble, h5.scramble, h6.scramble, summary.scramble').forEach(heading => {
            observer.observe(heading);
        });
    });
}

// SCRAMBLER VOOR LINKS EN KNOPPEN //////////////////////////////////////////////

if (!prefersReducedMotion) {
    document.addEventListener("DOMContentLoaded", () => {
        document.querySelectorAll('a.scramble, button.scramble').forEach(el => {
            
            el.addEventListener('mouseenter', function() {
                scramble(this);
            });
            
        });
    });
}

// GRID ////////////////////////////////////////////////////////////////////////

const canvas = document.getElementById('y2k-grid');
const ctx = canvas.getContext('2d');

const GRID_SIZE = 20;
const TILE_RADIUS = 4;
const HOVER_RADIUS = 150;
const GLITCH_CHANCE = 0.00001;

let cols = 0;
let rows = 0;
let tiles = [];
const mouse = { x: -1000, y: -1000 };

let hoverProgress = 0; 

function hexToRgb(hex) {
    hex = hex.replace('#', '');
    if (hex.length === 3) hex = hex.split('').map(c => c + c).join('');
    const num = parseInt(hex, 16);
    return { r: (num >> 16) & 255, g: (num >> 8) & 255, b: num & 255 };
}

function lightenRgb(rgb, factor = 0.6) {
    return {
        r: Math.round(rgb.r + (255 - rgb.r) * factor),
        g: Math.round(rgb.g + (255 - rgb.g) * factor),
        b: Math.round(rgb.b + (255 - rgb.b) * factor)
    };
}

function getColors() {
    const computed = getComputedStyle(document.documentElement);
    const rawGridLine = computed.getPropertyValue('--color-secondary').trim() || '#ffffff';
    const rawAccent = computed.getPropertyValue('--color-accent').trim() || '#ff0000';

    const baseRgb = hexToRgb(rawGridLine);
    
    return {
        bg: computed.getPropertyValue('--color-primary').trim() || '#111111',
        gridLine: lightenRgb(baseRgb, 0.65), 
        accent: hexToRgb(rawAccent)
    };
}

let colors = getColors();

window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => colors = getColors());

const interactiveSelectors = 'a, button, input[type="submit"], .ring li, summary, #portfolio-container li';

document.body.addEventListener('mouseover', (e) => {
    if (e.target.closest(interactiveSelectors)) {
        document.documentElement.classList.add('js-grid-hover');
    }
});

document.body.addEventListener('mouseout', (e) => {
    if (e.target.closest(interactiveSelectors)) {
        document.documentElement.classList.remove('js-grid-hover');
    }
});

let prevMouse = { x: -1000, y: -1000 };

if (hasHoverSupport) {
    window.addEventListener('mousemove', (e) => {
        mouse.x = e.clientX;
        mouse.y = e.clientY;

        if (!prefersReducedMotion && prevMouse.x !== -1000) {
            const dx = mouse.x - prevMouse.x;
            const dy = mouse.y - prevMouse.y;

            if (Math.hypot(dx, dy) > 8 && Math.random() < 1) {
                const trailX = mouse.x - dx * 2;
                const trailY = mouse.y - dy * 2;

                const targetCol = Math.floor(trailX / GRID_SIZE);
                const targetRow = Math.floor(trailY / GRID_SIZE);

                if (targetCol >= 0 && targetCol < cols && targetRow >= 0 && targetRow < rows) {
                    const currentTile = tiles[targetRow * cols + targetCol];

                    if (currentTile && !currentTile.isGlitching) {
                        currentTile.isGlitching = true;
                        currentTile.glitchTimer = Math.floor(Math.random() * 8) + 1; 
                    }
                }
            }
        }

        prevMouse.x = mouse.x;
        prevMouse.y = mouse.y;
    });
}

function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    cols = Math.ceil(canvas.width / GRID_SIZE);
    rows = Math.ceil(canvas.height / GRID_SIZE);
    tiles = [];
    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
            tiles.push({
                col: c,
                row: r,
                x: c * GRID_SIZE,
                y: r * GRID_SIZE,
                opacity: 0,
                isGlitching: false,
                glitchTimer: 0
            });
        }
    }
}
window.addEventListener('resize', resize);
resize();

// --- Animation Loop --- //
function animate() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const radiusSq = HOVER_RADIUS * HOVER_RADIUS;
    const isHovering = document.documentElement.classList.contains('js-grid-hover');

    const targetHoverProgress = isHovering ? 1 : 0;
    hoverProgress += (targetHoverProgress - hoverProgress) * 0.1;

    const currentR = Math.round(colors.gridLine.r + (colors.accent.r - colors.gridLine.r) * hoverProgress);
    const currentG = Math.round(colors.gridLine.g + (colors.accent.g - colors.gridLine.g) * hoverProgress);
    const currentB = Math.round(colors.gridLine.b + (colors.accent.b - colors.gridLine.b) * hoverProgress);
    const currentColorStr = `rgb(${currentR}, ${currentG}, ${currentB})`;

    // CURSOR GLOW //
    if (hasHoverSupport) {
        const minCol = Math.max(0, Math.floor((mouse.x - HOVER_RADIUS) / GRID_SIZE));
        const maxCol = Math.min(cols - 1, Math.ceil((mouse.x + HOVER_RADIUS) / GRID_SIZE));
        const minRow = Math.max(0, Math.floor((mouse.y - HOVER_RADIUS) / GRID_SIZE));
        const maxRow = Math.min(rows - 1, Math.ceil((mouse.y + HOVER_RADIUS) / GRID_SIZE));

        tiles.forEach(tile => {
            const inBoundingBox = tile.col >= minCol && tile.col <= maxCol && tile.row >= minRow && tile.row <= maxRow;
            let targetOpacity = 0;

            if (inBoundingBox) {
                const dx = (tile.x + GRID_SIZE / 2) - mouse.x;
                const dy = (tile.y + GRID_SIZE / 2) - mouse.y;
                const distSq = dx * dx + dy * dy;

                if (distSq < radiusSq) {
                    targetOpacity = 0.15 * (1 - distSq / radiusSq);
                }
            }

            tile.opacity += (targetOpacity - tile.opacity) * 0.2;

            if (tile.opacity > 0.002) {
                ctx.beginPath();
                ctx.roundRect(tile.x + 2, tile.y + 2, GRID_SIZE - 4, GRID_SIZE - 4, TILE_RADIUS);
                ctx.fillStyle = currentColorStr;
                ctx.globalAlpha = tile.opacity;
                ctx.fill();
            } else {
                tile.opacity = 0;
            }
        });
    }

    // GLITCH PIXELS //
    if (!prefersReducedMotion) {
        if (Math.random() < GLITCH_CHANCE * (cols * rows)) {
            const randomTile = tiles[Math.floor(Math.random() * tiles.length)];
            if (randomTile && !randomTile.isGlitching) {
                randomTile.isGlitching = true;
                randomTile.glitchTimer = Math.floor(Math.random() * 8) + 4;
            }
        }

        tiles.forEach(tile => {
            if (tile.isGlitching) {
                ctx.beginPath();
                ctx.roundRect(tile.x + 4, tile.y + 4, GRID_SIZE - 8, GRID_SIZE - 8, TILE_RADIUS);
                ctx.fillStyle = Math.random() > 0.5 ? `rgb(${colors.accent.r}, ${colors.accent.g}, ${colors.accent.b})` : currentColorStr;
                ctx.globalAlpha = 0.7;
                ctx.fill();

                tile.glitchTimer--;
                if (tile.glitchTimer <= 0) tile.isGlitching = false;
            }
        });
    }

    requestAnimationFrame(animate);
}

animate();