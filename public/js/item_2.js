function searchProducts() {
    const searchQuery = document.getElementById("searchInput").value.toLowerCase();

    fetch(`http://127.0.0.1:8080/search_items?search=${searchQuery}`, {
        method: "GET",
        headers: {
            "Content-Type": "application/json",
        },
    })
        .then((response) => {
            if (!response.ok) {
                throw new Error("Failed to fetch products");
            }
            return response.json();
        })
        .then((products) => {
            displaySearchedProducts(products);
        })
        .catch((error) => {
            console.error("Error searching products:", error);
        });
}
function displaySearchedProducts(products) {
    const productsContainer = document.getElementById("productsContainer");
    productsContainer.innerHTML = "";
    console.log(products);

    if (products.length === 0) {
        productsContainer.innerHTML = "<p style='text-align:center;'>No products found</p>";
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
                <div class="product_btn">
                <button class="edit" onclick="editProduct('${product.item_id}', '${product.item_name}', '${
            product.item_cost
        }', '${product.availability}', '${product.item_image}')">Edit</button>
                <button class="delete" onclick="deleteProduct(${product.item_id}, '${
            product.item_name
        }')">Delete</button></div></div>
            </div>
        `;

        productsContainer.appendChild(productDiv);
    });
}

function openModal() {
    document.getElementById("add_item_Modal").style.display = "block";
}

function closeModal() {
    const form = document.getElementById("addItemForm");
    form.reset();
    document.getElementById("add_item_Modal").style.display = "none";
}

function closeEditModal() {
    document.getElementById("edit_item_Modal").style.display = "none";
}

document.getElementById("addItemForm").addEventListener("submit", function (e) {
    e.preventDefault();

    const formElement = document.getElementById("addItemForm");
    const formData = new FormData(formElement);
    const productData = Object.fromEntries(formData.entries());
    console.log(formData);
    console.log(productData);
    fetch(`http://127.0.0.1:8080/items`, {
        method: "POST",
        body: formData,
    })
        .then((response) => {
            if (!response.ok) {
                return response.json().then((errorData) => {
                    if (errorData.message === "Product already exists") {
                        alert(`Product "${errorData.item_id}" already exists.`);
                    } else {
                        throw new Error("Failed to add product");
                    }
                });
            }
            return response.json();
        })
        .then((data) => {
            console.log("product added successfully:", data);
            fetchProducts();
            closeModal();
        })
        .catch((error) => {
            console.error("Error adding product]:", error);
        });
});
function editProduct(item_id, Name, Cost, availability, img) {
    id = item_id;

    document.getElementById("edit_item_Modal").style.display = "block";
    document.getElementById("edit_item_name").value = Name;
    document.getElementById("edit_item_cost").value = parseFloat(Cost);
    document.getElementById("edit_item_image").value = "";

    document.getElementById("edit_availability").value = availability;
    const imagePreview = document.getElementById("image_preview");
    if (imagePreview) {
        imagePreview.src = img;
    }

    document.getElementById("editItemForm").onsubmit = function (e) {
        e.preventDefault();

        const formElement = document.getElementById("editItemForm");
        const formData = new FormData(formElement);

        if (!formData.get("edit_item_image")) {
            formData.append("edit_item_image", "");
        }

        const updatedProductData = Object.fromEntries(formData.entries());

        console.log(updatedProductData);

        fetch(`http://127.0.0.1:8080/items/${id}`, {
            method: "PUT",
            body: formData,
        })
            .then((response) => {
                if (!response.ok) {
                    throw new Error("Failed to edit product");
                }
                return response.json();
            })
            .then((data) => {
                console.log("Product updated successfully:", data);
                fetchProducts();
                closeEditModal();
            })
            .catch((error) => {
                console.error("Error editing product:", error);
            });
    };
}

async function fetchProducts() {
    const loader = document.getElementById("loader");
    const errorMessage = document.getElementById("errorMessage");
    const productsContainer = document.getElementById("productsContainer");

    loader.style.display = "block";
    errorMessage.style.display = "none";
    productsContainer.innerHTML = "";

    try {
        const response = await fetch(`http://127.0.0.1:8080/items`, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
            },
        });
        if (!response.ok) {
            throw new Error(`Failed to fetch products`);
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
function deleteProduct(id, Name) {
    if (confirm(`Are you sure you want to delete ${Name}?`)) {
        fetch(`http://127.0.0.1:8080/items/${id}`, {
            method: "DELETE",
        })
            .then((response) => {
                if (!response.ok) {
                    throw new Error("Failed to delete product ");
                }
                console.log(`${Name} deleted successfully`);
                fetchProducts();
            })
            .catch((error) => {
                console.error("Error deleting product", error);
            });
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
                                    <div class="product_btn">
                                    <button class="edit" onclick="editProduct('${product.item_id}','${
            product.item_name
        }','${product.item_cost}','${product.availability}','${product.item_image}')">Edit</button>
                                    <button class="delete" onclick="deleteProduct(${product.item_id},'${
            product.item_name
        }')">Delete</button></div>
                                    </div>

                                `;

        productContainer.appendChild(productDiv);
    });
}

document.addEventListener("DOMContentLoaded", fetchProducts);
