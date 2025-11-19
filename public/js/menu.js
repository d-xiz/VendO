const toggleSidebar = () => {
    const sidebar = document.querySelector(".sidebar");
    const main = document.querySelector(".main");
    sidebar.classList.toggle("show");
    main.classList.toggle("shifted");
};

const switchPage = (e, targetPage) => {
    e.preventDefault();

    const pages = document.querySelectorAll(".page");

    pages.forEach((page) => {
        page.classList.add("hidden");
    });

    const targetElement = document.getElementById(targetPage);
    if (targetElement) {
        targetElement.classList.remove("hidden");
    }

    const sidebar = document.querySelector(".sidebar");
    const main = document.querySelector(".main");
    sidebar.classList.remove("show");
    main.classList.remove("shifted");
};

const handleExternalLinks = () => {
    const productsLink = document.getElementById("productsLink");
    const reportLink = document.getElementById("reportLink");
    const vendingMachinesLink = document.getElementById("vendingMachinesLink");

    if (productsLink) {
        productsLink.addEventListener("click", function (e) {
            e.preventDefault();
            window.location.href = "items.html";
        });
    }

    if (reportLink) {
        reportLink.addEventListener("click", (e) => {
            e.preventDefault();
            window.location.href = "report.html";
        });
    }

    if (vendingMachinesLink) {
        vendingMachinesLink.addEventListener("click", function (e) {
            e.preventDefault();
            window.location.href = "vendingMachine.html";
        });
    }
};

const initSidebarNavigation = () => {
    const menuButton = document.querySelector(".menu-button");
    const links = document.querySelectorAll(".sidebar a");

    if (menuButton) {
        menuButton.addEventListener("click", toggleSidebar);
    }

    links.forEach((link) => {
        link.addEventListener("click", (e) => {
            const targetPage = link.getAttribute("data-page");
            switchPage(e, targetPage);
        });
    });
};

document.addEventListener("DOMContentLoaded", () => {
    initSidebarNavigation();
    handleExternalLinks();
});
