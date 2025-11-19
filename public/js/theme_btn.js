const sunIcon = document.getElementById("sun-icon");
const moonIcon = document.getElementById("moon-icon");

const themeToggleButton = document.getElementById("theme-toggle");

themeToggleButton.addEventListener("click", () => {
    const isDarkMode = document.documentElement.getAttribute("data-theme") === "dark";

    if (isDarkMode) {
        document.documentElement.setAttribute("data-theme", "light");
        sunIcon.classList.remove("hidden");
        moonIcon.classList.add("hidden");

        localStorage.setItem("theme", "light");
    } else {
        document.documentElement.setAttribute("data-theme", "dark");
        sunIcon.classList.add("hidden");
        moonIcon.classList.remove("hidden");

        localStorage.setItem("theme", "dark");
    }
});

window.addEventListener("load", () => {
    const savedTheme = localStorage.getItem("theme");
    if (savedTheme) {
        document.documentElement.setAttribute("data-theme", savedTheme);
        if (savedTheme === "dark") {
            sunIcon.classList.remove("hidden");
            moonIcon.classList.add("hidden");
        } else {
            sunIcon.classList.add("hidden");
            moonIcon.classList.remove("hidden");
        }
    } else {
        document.documentElement.setAttribute("data-theme", "light");
        sunIcon.classList.add("hidden");
        moonIcon.classList.remove("hidden");
    }
});
