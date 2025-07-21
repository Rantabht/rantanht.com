// === SLIDER ===
const slides = document.querySelectorAll(".slide");
const slidesContainer = document.getElementById("slides");
const pagination = document.getElementById("pagination");
const prevBtn = document.getElementById("prevBtn");
const nextBtn = document.getElementById("nextBtn");

let currentIndex = 0;
let interval = null;

function showSlide(index) {
  slidesContainer.style.transform = `translateX(-${index * 100}%)`;
  updatePagination(index);
}

function updatePagination(index) {
  const bullets = pagination.querySelectorAll(".bullet");
  bullets.forEach((bullet, i) => {
    bullet.classList.toggle("active", i === index);
  });
}

function createPagination() {
  slides.forEach((_, index) => {
    const bullet = document.createElement("span");
    bullet.classList.add("bullet");
    if (index === 0) bullet.classList.add("active");
    bullet.addEventListener("click", () => {
      currentIndex = index;
      showSlide(currentIndex);
      resetInterval();
    });
    pagination.appendChild(bullet);
  });
}

function nextSlide() {
  currentIndex = (currentIndex + 1) % slides.length;
  showSlide(currentIndex);
}

function prevSlide() {
  currentIndex = (currentIndex - 1 + slides.length) % slides.length;
  showSlide(currentIndex);
}

function startInterval() {
  interval = setInterval(nextSlide, 5000); // 5 secondes
}

function resetInterval() {
  clearInterval(interval);
  startInterval();
}

// Initialisation du slider
createPagination();
showSlide(currentIndex);
startInterval();

nextBtn.addEventListener("click", () => {
  nextSlide();
  resetInterval();
});
prevBtn.addEventListener("click", () => {
  prevSlide();
  resetInterval();
});

// === MENU BURGER ===
const burgerMenu = document.getElementById("burger-menu");
const navMenu = document.getElementById("nav-menu");
const overlay = document.getElementById("menu-overlay");

function toggleMenu() {
  burgerMenu.classList.toggle("active");
  navMenu.classList.toggle("active");
  overlay.classList.toggle("active");
}

// Activer/désactiver le menu mobile
burgerMenu.addEventListener("click", toggleMenu);
overlay.addEventListener("click", toggleMenu);
