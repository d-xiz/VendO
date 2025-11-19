document.addEventListener("DOMContentLoaded", () => {
    fetchVendingMachine();
});
const menuButton = document.querySelector(".menu-button");
const sidebar = document.querySelector(".sidebar");
const main = document.querySelector(".main");
const links = document.querySelectorAll(".sidebar a");
const pages = document.querySelectorAll(".page");

const machineData = document.getElementById("machineData");
const editModal = document.getElementById("editModal");
const editForm = document.getElementById("editForm");
function fetchVendingMachine() {
    const url = "http://127.0.0.1:8080/vendingMachine";

    fetch(url)
        .then((response) => {
            if (!response.ok) {
                throw new Error("Network response was not ok");
            }
            return response.json();
        })
        .then((data) => {
            console.log(data);
            displayMachineData(data);
        })
        .catch((error) => {
            console.error("There was a problem with the fetch operation:", error);
        });
}

function displayMachineData(data) {
    const machineDataDiv = document.getElementById("machineData");
    machineDataDiv.innerHTML = "";

    const table = document.createElement("table");
    machineDataDiv.appendChild(table);

    const headerRow = document.createElement("tr");
    headerRow.innerHTML = `
            <th>id</th>
            <th>Vendor Name</th>
            <th>Location</th>
            <th>status</th>
            <th>Payment Methods</th>
            <th>Actions</th>
        `;
    table.appendChild(headerRow);

    data.forEach((item, index) => {
        const row = document.createElement("tr");
        let statusClass = "";
        if (item.status_name.toLowerCase() === "active") {
            statusClass = "active";
        } else if (item.status_name.toLowerCase() === "inactive") {
            statusClass = "inactive";
        } else if (item.status_name.toLowerCase() === "out of service") {
            statusClass = "out-of-service";
        } else if (item.status_name.toLowerCase() === "under maintenance") {
            statusClass = "under-maintenance";
        }
        const locationFormatted = `
            <div>
                <div> ${item.school}</div>
                <div>Block- ${item.block}</div>
                <div>Floor- ${item.floor}</div>
            </div>
        `;
        row.innerHTML = `
                <td>${index + 1}</td>
                <td>${item.vendor_name}</td>
                <td>${locationFormatted}</td>
                <td class="${statusClass}">${item.status_name}</td>
                <td>${item.payment_methods}</td>
                <td>
                    <button  class="view-button" onclick="viewProduct('${
                        item.vending_machine_id
                    }')">Edit/View product</button>
                    <button  class="edit-button" onclick="editVendingMachine('${item.vending_machine_id}','${
            item.vendor_name
        }', '${item.school}','${item.block}','${item.floor}', '${item.status_id}','${
            item.payment_methods
        }')">Edit</button>
                    <button  class="delete-button" onclick="deleteVendingMachine('${item.vending_machine_id}','${
            item.vendor_name
        }')">Delete</button>
                </td>
            `;
        table.appendChild(row);
    });
}

function editVendingMachine(id, vendorName, school, block, floor, status, paymentMethods) {
    const modal = document.getElementById("editModal");
    modal.style.display = "block";

    document.getElementById("editVendorName").value = vendorName;
    document.getElementById("editSchool").value = school.trim();
    document.getElementById("editBlock").value = block.trim();
    document.getElementById("editFloor").value = floor.trim();
    document.getElementById("editStatus").value = status;

    const paymentArray = paymentMethods.split(",").map((method) => method.trim());

    document.querySelectorAll("input[name='paymentMethods']").forEach((checkbox) => {
        checkbox.checked = false;
    });

    document.querySelectorAll("input[name='paymentMethods']").forEach((checkbox) => {
        if (paymentArray.includes(checkbox.value)) {
            checkbox.checked = true;
        }
    });

    document.getElementById("editForm").onsubmit = async function (event) {
        event.preventDefault();

        const updatedVendorName = document.getElementById("editVendorName").value;
        const updatedSchool = document.getElementById("editSchool").value;
        const updatedBlock = document.getElementById("editBlock").value;
        const updatedFloor = document.getElementById("editFloor").value;
        const updatedStatus = document.getElementById("editStatus").value;
        const updatedPayments = Array.from(document.querySelectorAll('input[name="paymentMethods"]:checked')).map(
            (checkbox) => checkbox.value
        );

        try {
            const response = await fetch(`http://127.0.0.1:8080/vendingMachine/${id}`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                },

                body: JSON.stringify({
                    newVendorName: updatedVendorName,
                    location: {
                        school: updatedSchool,
                        block: updatedBlock,
                        floor: updatedFloor,
                    },
                    status: updatedStatus,
                    paymentMethods: updatedPayments,
                }),
            });

            if (!response.ok) {
                throw new Error("Failed to update vending machine");
            }

            console.log("Vending machine updated successfully");
            fetchVendingMachine();
            closeModal();
        } catch (error) {
            console.error("Error updating vending machine:", error);
        }
    };
}

function deleteVendingMachine(id, vendorName) {
    if (confirm(`Are you sure you want to delete ${vendorName}?`)) {
        fetch(`http://127.0.0.1:8080/vendingMachine/${id}`, {
            method: "DELETE",
        })
            .then((response) => {
                if (!response.ok) {
                    throw new Error("Failed to delete vending machine");
                }
                console.log(`${id} deleted successfully`);

                fetchVendingMachine();
            })
            .catch((error) => {
                console.error("Error deleting vending machine:", error);
            });
    }
}

function viewProduct(id) {
    window.location.href = `products.html?vendingMachineId=${id}`;
}

function closeModal() {
    const modal = document.getElementById("editModal");
    modal.style.display = "none";
}
function closeAddModal() {
    const modal = document.getElementById("addVendingModal");
    modal.style.display = "none";
}

window.onclick = function (event) {
    const modal = document.getElementById("editModal");
    if (event.target === modal) {
        closeModal();
    }
};

document.getElementById("addVendingForm").addEventListener("submit", function (e) {
    e.preventDefault();
    const formElement = document.getElementById("addVendingForm");
    const formData = new FormData(formElement);

    const paymentMethods = [];
    formData.forEach((value, key) => {
        if (key === "paymentMethods") {
            paymentMethods.push(parseInt(value));
        }
    });

    const vendingData = Object.fromEntries(formData.entries());
    vendingData.paymentMethods = paymentMethods;

    const jsonString = JSON.stringify(vendingData);

    console.log(jsonString);

    fetch("http://127.0.0.1:8080/vendingMachine", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: jsonString,
    })
        .then((response) => {
            if (!response.ok) {
                throw new Error("Failed to add vending machine");
            }
            return response.json();
        })
        .then(() => {
            console.log("Vending machine added successfully:");
            fetchVendingMachine();
            closeAddModal();
        })
        .catch((error) => {
            console.error("Error adding vending machine:", error);
        });
});

function openVendingMachine() {
    const modal = document.getElementById("addVendingModal");
    modal.style.display = "block";
}
