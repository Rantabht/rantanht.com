const slider = document.getElementById('slider');
const toggleScrollBtn = document.getElementById('toggleScrollBtn');

let isScrolling = true;
let scrollInterval = null;
let userInteracting = false;
let inactivityTimeout = null;
let scrollDirection = 1; // 1 = droite →, -1 = gauche ←

// Icônes du bouton
const pauseIcon = `
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
    <rect x="6" y="4" width="4" height="16" rx="1"></rect>
    <rect x="14" y="4" width="4" height="16" rx="1"></rect>
  </svg> Pause défilement`;

const playIcon = `
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
    <polygon points="5,3 19,12 5,21"></polygon>
  </svg> Reprendre`;

// Met à jour l'icône du bouton
function updateButtonIcon() {
  toggleScrollBtn.innerHTML = isScrolling ? pauseIcon : playIcon;
}

// Démarre le scroll automatique (avec inversion de direction)
function startAutoScroll() {
  if (scrollInterval) clearInterval(scrollInterval);
  scrollInterval = setInterval(() => {
    if (isScrolling && !userInteracting) {
      slider.scrollLeft += scrollDirection;

      // Vérifie si on est au bout
      const maxScrollLeft = slider.scrollWidth - slider.clientWidth;

      if (slider.scrollLeft <= 0 || slider.scrollLeft >= maxScrollLeft) {
        scrollDirection *= -1; // inverse la direction
      }
    }
  }, 20);
}

// Met en pause manuellement
function pauseAutoScroll() {
  isScrolling = false;
  updateButtonIcon();
}

// Reprendre après X secondes d'inactivité
function restartAfterInactivity(delay = 3000) {
  if (inactivityTimeout) clearTimeout(inactivityTimeout);
  inactivityTimeout = setTimeout(() => {
    isScrolling = true;
    userInteracting = false;
    updateButtonIcon();
  }, delay);
}

// Détection interaction utilisateur
['touchstart', 'mousedown', 'wheel'].forEach(eventType => {
  slider.addEventListener(eventType, () => {
    userInteracting = true;
    pauseAutoScroll();
  });
});

['touchend', 'mouseup'].forEach(eventType => {
  slider.addEventListener(eventType, () => {
    restartAfterInactivity();
  });
});

// Initialisation
startAutoScroll();
updateButtonIcon();
