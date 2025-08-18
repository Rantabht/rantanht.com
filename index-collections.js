/**
 * Script pour gérer deux sliders avec autoscroll indépendant,
 * inversion de direction aux extrémités, et pause au scroll manuel.
 * Le scroll redémarre après 3 secondes d'inactivité utilisateur.
 */
document.addEventListener("DOMContentLoaded", () => {
  const sliders = [
    {
      el: document.getElementById("slider"),
      speed: 1.5,
      delay: 0,
      direction: 1
    },
    {
      el: document.getElementById("categories-slider"),
      speed: 1,
      delay: 800,
      direction: -1
    }
  ];

  sliders.forEach(({ el, speed, delay, direction }) => {
    if (!el) return;

    let scrollDirection = direction;
    let userInteracting = false;
    let intervalId;
    let inactivityTimeout;

    // Fonction pour démarrer le scroll automatique
    function startAutoScroll() {
      setTimeout(() => {
        intervalId = setInterval(() => {
          if (!userInteracting) {
            el.scrollLeft += scrollDirection * speed;
            const maxScrollLeft = el.scrollWidth - el.clientWidth;

            if (el.scrollLeft <= 0 || el.scrollLeft >= maxScrollLeft) {
              scrollDirection *= -1;
            }
          }
        }, 20);
      }, delay);
    }

    // Fonction pour redémarrer le scroll après une pause utilisateur
    function restartAfterInactivity() {
      clearTimeout(inactivityTimeout);
      inactivityTimeout = setTimeout(() => {
        userInteracting = false;
      }, 3000); // ⏱️ 3 secondes d'inactivité avant reprise automatique
    }

    // Met en pause à l'interaction
    ['mousedown', 'touchstart', 'wheel'].forEach(eventType => {
      el.addEventListener(eventType, () => {
        userInteracting = true;
        restartAfterInactivity(); // Prépare à redémarrer après une pause
      });
    });

    // Enregistre la fin de l'interaction pour potentiellement redémarrer
    ['mouseup', 'touchend', 'mouseleave'].forEach(eventType => {
      el.addEventListener(eventType, () => {
        restartAfterInactivity();
      });
    });

    startAutoScroll();
  });
});
