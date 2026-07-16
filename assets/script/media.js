// Website Made by Bence (bencebarens.nl)
async function loadPhotos() {
  try {
    const response = await fetch('./media.json');
    const photoFiles = await response.json();
    const listContainer = document.getElementById('photo-grid');

    const imageWidth = 200;       // Maximale breedte in pixels
    const imageQuality = 50;      // Kwaliteit (tussen 1 en 100)
    const imageFormat = 'webp';   // Output formaat (webp, png, jpg)

    photoFiles.forEach(relativeFilePath => {
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

      li.appendChild(img);
      li.appendChild(span);
      listContainer.appendChild(li);
    });

  } catch (error) {
    console.error("Fout bij het laden van de geoptimaliseerde foto's:", error);
  }
}

loadPhotos();