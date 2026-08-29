const menuButton = document.getElementById("menu-button");
const mainNav = document.getElementById("main-nav");

menuButton.onclick = function () {
    mainNav.classList.toggle("open");
};