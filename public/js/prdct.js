document.getElementById("showAllProductsBtn").addEventListener("click", function (e) {
    e.preventDefault();
    document.getElementById("showAllProductsModal").style.display = "block";
    fetchAllProducts();
});
document.getElementById("closeAddQuantityModalBtn").addEventListener("click", () => {
    document.getElementById("AddQuantityModal").style.display = "none";
});
document.getElementById("closeEditProductsModalBtn").addEventListener("click", () => {
    document.getElementById("EditQuantityModal").style.display = "none";
});

document.getElementById("closeProductsModalBtn").addEventListener("click", function () {
    document.getElementById("showAllProductsModal").style.display = "none";
});

window.addEventListener("click", function (e) {
    const showAllProductsModal = document.getElementById("showAllProductsModal");
    if (e.target === showAllProductsModal) {
        showAllProductsModal.style.display = "none";
    }

    const addQuantityModal = document.getElementById("AddQuantityModal");
    if (e.target === addQuantityModal) {
        addQuantityModal.style.display = "none";
    }

    const editQuantityModal = document.getElementById("EditQuantityModal");
    if (e.target === editQuantityModal) {
        editQuantityModal.style.display = "none";
    }
});

function fetchAllProducts() {
    const urlParams = new URLSearchParams(window.location.search);
    const vendingMachineId = urlParams.get("vendingMachineId");
    if (!vendingMachineId) {
        console.error("Vending Machine ID is missing in the URL");
        return;
    }
    fetch(`http://127.0.0.1:8080/vm_items/${vendingMachineId}`, {
        method: "GET",
    })
        .then((response) => response.json())
        .then((data) => {
            displayAllProducts(data);
        })
        .catch((error) => {
            console.error("Error fetching products:", error);
        });
}

function displayAllProducts(data) {
    const productsDataDiv = document.getElementById("productsDataDiv");
    productsDataDiv.innerHTML = "";
    if (!data || data.length === 0) {
        productsDataDiv.innerHTML = "<p>No products available.</p>";
        return;
    }

    const table = document.createElement("table");

    const headerRow = document.createElement("tr");
    headerRow.innerHTML = `
                <th>Image</th>
                <th>Product Name</th>
                <th>Cost</th>
                <th>Availability</th>
                <th>Actions</th>
            `;
    table.appendChild(headerRow);

    data.forEach((product) => {
        const row = document.createElement("tr");

        row.innerHTML = `
                    <td><img src='${product.item_image}' alt=${product.item_name} width="50"></td>
                    <td>${product.item_name}</td>
                    <td>$${parseFloat(product.item_cost).toFixed(2)}</td>
                    <td>${product.availability == 1 ? "Available" : "Unavailable"}</td>
                    <td>
                        <button onclick="addProductToVendingMachine('${product.item_id}')"${
            product.availability === 0 ? "disabled" : ""
        }>Add</button>
                    </td>
                `;
        table.appendChild(row);
    });
    productsDataDiv.appendChild(table);
}

let currentProductId = null;
let currentVendingMachineId = null;

function addProductToVendingMachine(productId) {
    const urlParams = new URLSearchParams(window.location.search);
    const vendingMachineId = urlParams.get("vendingMachineId");
    if (!vendingMachineId) {
        console.error("Vending Machine ID is missing in the URL");
        return;
    }
    currentProductId = productId;
    currentVendingMachineId = vendingMachineId;

    const modal = document.getElementById("AddQuantityModal");
    modal.style.display = "block";
}

document.getElementById("addQuantitySubmitBtn").addEventListener("click", () => {
    const quantityInput = document.getElementById("quantityInput");
    const quantity = parseInt(quantityInput.value);

    if (!quantity || isNaN(quantity) || quantity <= 0) {
        alert("Please provide a valid quantity.");
        return;
    }

    fetch(`http://127.0.0.1:8080/vm_items/${currentVendingMachineId}/items`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({ item_id: currentProductId, quantity: parseInt(quantity) }),
    })
        .then((response) => response.json())
        .then((data) => {
            if (data.message) {
                alert(data.message);
            }
            fetchVendingProducts();
            document.getElementById("AddQuantityModal").style.display = "none";
            document.getElementById("showAllProductsModal").style.display = "none";
        })
        .catch((error) => {
            console.error("Error adding product to vending machine:", error);
        });
});

function editQuantity(itemId) {
    const urlParams = new URLSearchParams(window.location.search);
    const vendingMachineId = urlParams.get("vendingMachineId");
    if (!vendingMachineId) {
        console.error("Vending Machine ID is missing in the URL");
        return;
    }

    fetch(`/vm_items/${itemId}/${vendingMachineId}`, {
        method: "GET",
    })
        .then((response) => response.json())
        .then((item) => {
            if (item) {
                const editQuantityDiv = document.getElementById("editQuantityDiv");
                editQuantityDiv.innerHTML = `
                    <form id="editQuantityForm">
                        <label for="itemName">Item Name:</label>
                        <input type="text" id="itemName" value="${item.item_name}" disabled /><br><br>

                        <label for="itemQuantity">Quantity:</label>
                        <input type="number" id="itemQuantity" value="${item.item_quantity}" min="0" />

                        <button type="button" id="saveQuantityBtn">Save</button>
                    </form>
                `;

                const modal = document.getElementById("EditQuantityModal");
                modal.style.display = "block";

                document.getElementById("saveQuantityBtn").addEventListener("click", () => {
                    const updatedQuantity = document.getElementById("itemQuantity").value;

                    fetch(`/vm_items/item/${itemId}/${vendingMachineId}`, {
                        method: "PUT",
                        headers: {
                            "Content-Type": "application/json",
                        },
                        body: JSON.stringify({ item_quantity: updatedQuantity }),
                    })
                        .then((response) => {
                            if (response.ok) {
                                alert("Quantity updated successfully!");
                                modal.style.display = "none";
                                location.reload();
                            } else {
                                alert("Failed to update quantity. Please try again.");
                            }
                        })
                        .catch((error) => console.error("Error updating quantity:", error));
                });
            } else {
                alert("Item not found!");
            }
        })
        .catch((error) => console.error("Error fetching item data:", error));
}

function deleteProduct(id, Name) {
    if (confirm(`Are you sure you want to delete ${Name}?`)) {
        const urlParams = new URLSearchParams(window.location.search);
        const vendingMachineId = urlParams.get("vendingMachineId");

        if (!vendingMachineId) {
            console.error("Vending Machine ID is missing in the URL");
        }

        fetch(`http://127.0.0.1:8080/vm_items/${vendingMachineId}/items/${id}`, {
            method: "DELETE",
        })
            .then((response) => {
                if (!response.ok) {
                    throw new Error("Failed to delete product ");
                }
                console.log(`${Name} deleted successfully`);

                fetchVendingProducts();
            })
            .catch((error) => {
                console.error("Error deleting product", error);
            });
    }
}
async function fetchVendingProducts() {
    const loader = document.getElementById("loader");
    const errorMessage = document.getElementById("errorMessage");
    const productsContainer = document.getElementById("productsContainer");

    loader.style.display = "block";
    errorMessage.style.display = "none";
    productsContainer.innerHTML = "";

    try {
        const urlParams = new URLSearchParams(window.location.search);
        const vendingMachineId = urlParams.get("vendingMachineId");
        console.log(vendingMachineId);

        if (!vendingMachineId) {
            console.error("Vending Machine ID is missing in the URL");
            return;
        }
        const response = await fetch(`http://127.0.0.1:8080/vm_items/${vendingMachineId}/products`, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
            },
        });
        if (!response.ok) {
            throw new Error(`Failed to fetch products for vending machine ${vendingMachineId}`);
        }

        const result = await response.json();
        displayProducts(result);
    } catch (error) {
        console.error("Error fetching products:", error);
        errorMessage.textContent = error.message;
        errorMessage.style.display = "block";
    } finally {
        loader.style.display = "none";
    }
}

function displayProducts(products) {
    const productContainer = document.getElementById("productsContainer");
    productContainer.innerHTML = "";

    if (products.length === 0) {
        productContainer.innerHTML = "<p style='text-align:center;'>No products available</p>";
        return;
    }

    products.forEach((product) => {
        const itemCost = parseFloat(product.item_cost);

        const productDiv = document.createElement("div");
        productDiv.classList.add("product");

        productDiv.innerHTML = `

                <img src="${product.item_image}" alt="${product.item_name}" />
                                    <h3>${product.item_name}</h3>
                                     <div class="product_details">
                                    <p><strong>$</strong> ${itemCost.toFixed(2)}</p>
                                    <p><strong></strong> ${product.availability ? "Available" : "Not Available"}</p>
                                    <p><strong>Quantity: </strong> ${product.item_quantity}</p>
                                    <div class="product_btn">
                                    <button onclick="editQuantity(${product.item_id})">Edit Quantity</button>

                                    <button class="delete" onclick="deleteProduct(${product.item_id},'${
            product.item_name
        }')">Delete</button></div>
                                    </div>

                                `;

        productContainer.appendChild(productDiv);
    });
}

document.addEventListener("DOMContentLoaded", fetchVendingProducts);
