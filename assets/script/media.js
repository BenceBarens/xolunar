// Website Made by Bence (bencebarens.nl)

async function loadPhotos() {
  try {
    const response = await fetch('./media.json');
    const photoFiles = await response.json();
    const listContainer = document.getElementById('photo-grid');

    const imageWidth = 100;
    const imageQuality = 50;
    const imageFormat = 'webp';

    photoFiles.forEach((relativeFilePath, index) => {
      const li = document.createElement('li');
      const img = document.createElement('img');
      const span = document.createElement('span');

      const rawGithubUrl = `https://raw.githubusercontent.com/BenceBarens/xolunar/main/assets/img/Photo/${relativeFilePath}`;

      img.src = `https://wsrv.nl/?url=${encodeURIComponent(rawGithubUrl)}&w=${imageWidth}&output=${imageFormat}&q=${imageQuality}`;
      
      img.alt = `Portfolio: ${relativeFilePath}`;
      img.loading = 'lazy';

      const fileName = relativeFilePath.split('/').pop();

      span.textContent = fileName;
      span.classList.add('photo-title');

      // Positie in de 3D cirkel
      li.style.setProperty('--i', index);

      li.appendChild(img);
      li.appendChild(span);
      listContainer.appendChild(li);
    });

    setupCarousel(listContainer, photoFiles.length);

  } catch (error) {
    console.error("Fout bij het laden van de geoptimaliseerde foto's:", error);
  }
}


function setupCarousel(grid, count) {
  const angle = 360 / count;

  // Breedte van een item ongeveer gebaseerd op 5em
  const itemWidth = 80;

  const radius = (itemWidth * count) / (Math.PI * 2);

  grid.style.setProperty('--angle', `${angle}deg`);
  grid.style.setProperty('--radius', `${radius}px`);
}


loadPhotos();