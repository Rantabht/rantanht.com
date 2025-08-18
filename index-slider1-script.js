// =============================
// MENU BURGER MOBILE
// =============================

const burger = document.getElementById('burger-menu');
const navMenu = document.getElementById('nav-menu');
const overlay = document.getElementById('menu-overlay');
const links = navMenu.querySelectorAll('a');

let isTransitioning = false; // Empêche les clics rapides multiples durant la transition

// Ouvre/ferme le menu burger
function toggleMenu() {
  if (isTransitioning) return;
  isTransitioning = true;

  burger.classList.toggle('active');       // Animation burger
  navMenu.classList.toggle('active');      // Affiche/masque menu
  overlay.classList.toggle('active');      // Affiche/masque overlay
  document.body.classList.toggle('menu-open'); // Bloque scroll page

  // Accessibilité : modifie aria-expanded
  const expanded = burger.getAttribute('aria-expanded') === 'true';
  burger.setAttribute('aria-expanded', !expanded);

  // Réinitialise la variable après transition CSS (400ms)
  setTimeout(() => {
    isTransitioning = false;
  }, 400);
}

// Événements pour ouvrir/fermer menu burger
burger.addEventListener('click', toggleMenu);
overlay.addEventListener('click', toggleMenu);

// Fermer menu en cliquant sur un lien
links.forEach(link => {
  link.addEventListener('click', () => {
    if (navMenu.classList.contains('active')) toggleMenu();
  });
});

// Support clavier (Entrée ou Espace sur burger)
burger.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' || e.key === ' ') {
    e.preventDefault();
    toggleMenu();
  }
});

// =============================
// SLIDER PRINCIPAL
// =============================

const slides = document.getElementById('slides');
const totalSlides = slides.children.length; // Nombre total de slides
let currentIndex = 0;                       // Index de la slide affichée
let intervalId = null;                      // ID intervalle défilement auto

const pagination = document.getElementById('pagination');

// Création dynamique des boutons de pagination
for (let i = 0; i < totalSlides; i++) {
  const btn = document.createElement('button');
  btn.setAttribute('aria-label', `Aller à la diapositive ${i + 1}`);
  if (i === 0) btn.classList.add('active'); // Active premier bouton

  btn.addEventListener('click', () => {
    goToSlide(i);
    resetInterval();
  });
  pagination.appendChild(btn);
}

// Affiche la slide correspondant à l'index
function goToSlide(index) {
  if (index < 0) index = totalSlides - 1;
  if (index >= totalSlides) index = 0;
  currentIndex = index;

  // Calcul du décalage en % à appliquer au slider
  const offset = -index * 100 / totalSlides;
  slides.style.transform = `translateX(${offset}%)`;

  updatePagination();
}

// Met à jour l'état des boutons de pagination
function updatePagination() {
  const buttons = pagination.querySelectorAll('button');
  buttons.forEach((btn, idx) => {
    btn.classList.toggle('active', idx === currentIndex);
    if (idx === currentIndex) {
      btn.setAttribute('aria-current', 'true');
    } else {
      btn.removeAttribute('aria-current');
    }
  });
}

// Navigation par flèches
document.getElementById('prevBtn').addEventListener('click', () => {
  goToSlide(currentIndex - 1);
  resetInterval();
});

document.getElementById('nextBtn').addEventListener('click', () => {
  goToSlide(currentIndex + 1);
  resetInterval();
});

// Défilement automatique toutes les 4 secondes
function startInterval() {
  intervalId = setInterval(() => {
    goToSlide(currentIndex + 1);
  }, 4000);
}

// Réinitialise l'intervalle après interaction utilisateur
function resetInterval() {
  clearInterval(intervalId);
  startInterval();
}

startInterval();

// =============================
// GESTION DU SWIPE TACTILE POUR LE SLIDER (MOBILE)
// =============================

let startX = 0;
let isDragging = false;

slides.addEventListener('touchstart', e => {
  startX = e.touches[0].clientX;
  isDragging = true;
});

slides.addEventListener('touchmove', e => {
  if (!isDragging) return;
  const moveX = e.touches[0].clientX;
  const diff = startX - moveX;

  if (Math.abs(diff) > 50) {
    if (diff > 0) {
      goToSlide(currentIndex + 1);
    } else {
      goToSlide(currentIndex - 1);
    }
    isDragging = false;
    resetInterval();
  }
});

slides.addEventListener('touchend', () => {
  isDragging = false;
});