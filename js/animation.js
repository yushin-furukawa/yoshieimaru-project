/* =========================
   SCROLL ANIMATION
========================= */

const animationElements = document.querySelectorAll(
    ".fade-in, .slide-up, .slide-left, .slide-right"
);

const animationObserver = new IntersectionObserver(
    (entries, observer) => {

        entries.forEach(entry => {

            if (entry.isIntersecting) {

                entry.target.classList.add("show");

                observer.unobserve(entry.target);

            }

        });

    },
    {
        threshold: 0.15
    }
);


animationElements.forEach(element => {

    animationObserver.observe(element);

});