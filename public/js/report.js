function fetchLowStockItems() {
    fetch("http://127.0.0.1:8080/vendingMachine/low-stock")
        .then((response) => response.json())
        .then((data) => {
            const lowStockTable = document.getElementById("lowStockTable").getElementsByTagName("tbody")[0];
            lowStockTable.innerHTML = "";
            data.forEach((item) => {
                const stockStatus =
                    item.item_quantity <= 3 ? "Really Low" : item.item_quantity <= 5 ? "Low" : "In Stock";
                const row = lowStockTable.insertRow();
                row.innerHTML = `
        <td>${item.item_name}</td>
        <td>${item.item_quantity}</td>
        <td>${item.vending_machine}</td>
       
        <td style="color: ${stockStatus === "Really Low" ? "red" : "rgb(196, 10, 10)"};">${stockStatus}</td>

    `;
            });
        })
        .catch((error) => console.error("Error fetching low stock items:", error));
}

function fetchMostPopularItems() {
    fetch("http://127.0.0.1:8080/vendingMachine/most-popular-items")
        .then((response) => response.json())
        .then((data) => {
            const ctx = document.getElementById("popularItemsGraph").getContext("2d");

            new Chart(ctx, {
                type: "bar",
                data: {
                    labels: data.map((item) => item.item_name),
                    datasets: [
                        {
                            label: "Total Quantity Available",
                            data: data.map((item) => item.total_quantity),
                            backgroundColor: "rgba(54, 162, 235, 0.2)",
                            borderColor: "rgba(54, 162, 235, 1)",
                            borderWidth: 1,
                        },
                    ],
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                        y: {
                            beginAtZero: true,
                        },
                    },
                },
            });
        })
        .catch((error) => console.error("Error fetching most popular items:", error));
}

function fetchVendingMachinesPerSchool() {
    fetch("http://127.0.0.1:8080/vendingMachine/vending-machines-per-school")
        .then((response) => response.json())
        .then((data) => {
            const schoolVendingTable = document.getElementById("schoolVendingTable").getElementsByTagName("tbody")[0];
            schoolVendingTable.innerHTML = "";

            data.forEach((school) => {
                const row = schoolVendingTable.insertRow();
                row.innerHTML = `
        <td>${school.school_name}</td>
        <td>${school.num_vending_machines}</td>
    `;
            });
        })
        .catch((error) => console.error("Error fetching vending machines per school:", error));
}

const reportContainers = document.querySelectorAll(".report-container");
const backgroundBlur = document.getElementById("backgroundBlur");
reportContainers.forEach((container) => {
    container.addEventListener("click", () => {
        container.classList.add("open");
        backgroundBlur.classList.add("open");
    });
});

backgroundBlur.addEventListener("click", () => {
    document.querySelector(".report-container.open")?.classList.remove("open");
    backgroundBlur.classList.remove("open");
});
document.addEventListener("DOMContentLoaded", () => {
    fetchLowStockItems();
    fetchMostPopularItems();
    fetchVendingMachinesPerSchool();
});
