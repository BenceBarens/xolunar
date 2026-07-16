
const grid = document.querySelector("#photo-grid");
const items = document.querySelectorAll("#photo-grid li");

const count = items.length;
const angle = 360 / count;

const itemWidth = 80; // ongeveer 5em in px

const radius = (itemWidth * count) / (Math.PI * 2) * 0.8;

grid.style.setProperty("--angle", `${angle}deg`);
grid.style.setProperty("--radius", `${radius}px`);