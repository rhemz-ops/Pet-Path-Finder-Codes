// Toggle  menu visibility
const hamburger = document.getElementById("menu-icon");
const navbarLinks = document.querySelector(".navbar-links");

hamburger.addEventListener("click", () => {
    navbarLinks.classList.toggle("active");
});
