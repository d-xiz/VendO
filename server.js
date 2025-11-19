var express = require("express");
var path = require("path");
var db = require("./db-connection");
var cors = require("cors");
var multer = require("multer");
var fs = require("fs");

var app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const uploadDir = path.join(__dirname, "public", "item_images");

        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }

        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        const fileName = file.originalname;
        cb(null, fileName);
    },
});

const upload = multer({ storage: storage });

app.route("/").get(function (req, res) {
    res.sendFile(path.join(__dirname, "public", "vendingMachine.html"));
});
// get all details
app.get("/vendingMachine", (req, res) => {
    const sql = `
        SELECT 
            vm.vending_machine_id,vm.vendor_name,vm.status_id,vs.status_name,
            l.school AS school,
            l.block AS block,
            l.floor AS floor,
            (SELECT GROUP_CONCAT(pm.payment_name SEPARATOR ', ') 
     FROM vending_machine.vending_payment vp
     JOIN vending_machine.payment_method pm ON vp.payment_id = pm.payment_id
     WHERE vp.vending_id = vm.vending_machine_id) AS payment_methods
FROM 
    vending_machine.vending_machine vm
JOIN 
    vending_machine.location l ON vm.location_id = l.location_id
JOIN
    vending_machine.status vs ON vm.status_id= vs.status_id
    ;

    `;

    db.query(sql, (error, result) => {
        if (error) {
            console.error("Error fetching vending machines:", error);
            return res.status(500).json({ message: "Error fetching vending machines", error });
        }
        res.json(result);
    });
});
// add vending machine
app.post("/vendingMachine", (req, res) => {
    const { vendorName, school, block, floor, status, paymentMethods } = req.body;
    console.log(req.body);

    if (!vendorName || !school || !block || !floor || !status || !paymentMethods) {
        return res.status(400).json({
            message: "Missing required fields: vendorName, school, block, floor, status, or paymentMethods.",
        });
    }

    const locationQuery = `
            INSERT INTO vending_machine.location (school, block, floor)
            VALUES (?, ?, ?)
        `;
    db.query(locationQuery, [school, block, floor], (err, locationResult) => {
        if (err) {
            console.error("Error inserting location:", err);
            return res.status(500).json({ message: "Error inserting location", error: err });
        }

        const locationId = locationResult.insertId;

        const vendingMachineQuery = `
                INSERT INTO vending_machine.vending_machine (vendor_name, location_id, status_id)
                VALUES (?, ?, ?)
            `;
        db.query(vendingMachineQuery, [vendorName, locationId, status], (err, vendingMachineResult) => {
            if (err) {
                console.error("Error inserting vending machine:", err);
                return res.status(500).json({ message: "Error inserting vending machine", error: err });
            }

            const vendingMachineId = vendingMachineResult.insertId;

            const paymentIds = paymentMethods.map((paymentId) => [vendingMachineId, paymentId]);
            const paymentQuery = `
                    INSERT INTO vending_machine.vending_payment (vending_id, payment_id)
                    VALUES ?
                `;
            db.query(paymentQuery, [paymentIds], (err) => {
                if (err) {
                    console.error("Error inserting payment methods:", err);
                    return res.status(500).json({ message: "Error inserting payment methods", error: err });
                }
                return res.status(201).json({
                    message: "Vending machine added successfully",
                });
            });
        });
    });
});
// update vending machine
app.put("/vendingMachine/:id", (req, res) => {
    const id = req.params.id;
    const { newVendorName, location, status, paymentMethods } = req.body;

    const paymentQuery = `
    SELECT payment_id 
    FROM vending_machine.payment_method
    WHERE payment_name IN (?);
`;

    db.query(paymentQuery, [paymentMethods], (err, results) => {
        if (err) {
            console.error("Error fetching payment ids:", err);
            return res.status(500).json({ message: "Error fetching payment ids", error: err });
        }

        const paymentIds = results.map((row) => row.payment_id);

        db.query(
            `
        UPDATE vending_machine.vending_machine vm
        JOIN vending_machine.location l ON vm.location_id = l.location_id
        SET  vm.vendor_name = ?,l.school = ?, l.block = ?, l.floor = ?,vm.status_id=?
        WHERE vm.vending_machine_id = ?
    `,
            [newVendorName, location.school, location.block, location.floor, status, id],
            (err) => {
                if (err) {
                    console.error("Error updating vending machine:", err);
                    return res.status(500).json({ message: "Error updating vending machine", error: err });
                }

                db.query(
                    `
                DELETE FROM vending_machine.vending_payment 
                WHERE vending_id = (SELECT vending_machine_id FROM vending_machine.vending_machine WHERE vending_machine_id = ?)
            `,
                    [id],
                    (err) => {
                        if (err) {
                            console.error("Error deleting old payment methods:", err);
                            return res.status(500).json({ message: "Error deleting old payment methods", error: err });
                        }

                        const values = paymentIds.map((paymentId) => [id, paymentId]);

                        const paymentQuery = `
                        INSERT INTO vending_machine.vending_payment (vending_id, payment_id)
                        VALUES ?
                        
                    `;
                        db.query(paymentQuery, [values], (err) => {
                            if (err) {
                                console.error("Error inserting new payment methods:", err);
                                return res
                                    .status(500)
                                    .json({ message: "Error inserting new payment methods", error: err });
                            }
                            return res.status(201).json({
                                message: "Vending machine edited successfully",
                            });
                        });
                    }
                );
            }
        );
    });
});
//  delete vending machine
app.delete("/vendingMachine/:id", (req, res) => {
    const id = req.params.id;

    const deletePaymentsSql = `
        DELETE FROM vending_machine.vending_payment 
        WHERE vending_id = ?;
    `;

    db.query(deletePaymentsSql, [id], (error) => {
        if (error) {
            console.error("Error deleting vending payments:", error);
            return res.status(500).json({ message: "Error deleting vending payments", error });
        }
    });

    db.query(
        `
        DELETE FROM vending_machine.vending_machine 
        WHERE vending_machine_id = ?;
    `,
        [id],
        (err) => {
            if (err) {
                console.error("Error deleting vending machine:", err);
                return res.status(500).json({ message: "Error deleting vending machine", error: err });
            }
            res.json({ message: "Vending machine deleted successfully!" });
        }
    );
});
////////////////////////////////////////////////////////////////////

//GET all ITEMS OF A VENDING MACHINE
app.get("/vm_items/:id/products", (req, res) => {
    const machineId = req.params.id;

    const sql = `
        SELECT 
            i.item_id,
            i.item_name, 
            i.item_cost, 
            i.item_image, 
            i.availability, 
            vi.quantity AS item_quantity  
        FROM 
            vending_machine.vending_item vi
        JOIN 
            vending_machine.item i ON vi.item_id = i.item_id
        WHERE 
            vi.vending_machine_id = ?;
    `;

    db.query(sql, [machineId], (error, results) => {
        if (error) {
            console.error("Error fetching vending machine products:", error);
            return res.status(500).json({ message: "Error fetching vending machine products", error });
        }

        if (results.length === 0) {
            return res.status(404).json({ error: "No products found for this vending machine" });
        }

        res.json(results);
    });
});

//get all items on modal
app.get("/vm_items/:id", (req, res) => {
    const vendingMachineId = req.params.id;
    const query = `
    SELECT 
        i.item_id,    
        i.item_name, 
        i.item_cost, 
        i.item_image, 
        i.availability
    FROM vending_machine.item i
    WHERE NOT EXISTS (
        SELECT 1 
        FROM vending_machine.vending_item vi
        WHERE vi.vending_machine_id = ? 
        AND vi.item_id = i.item_id
    )`;

    db.query(query, [vendingMachineId], (err, results) => {
        if (err) {
            console.error("Error fetching products:", err);
            res.status(500).json({ error: "Failed to fetch products" });
        } else {
            res.json(results);
        }
    });
});

//delete product
app.delete("/vm_items/:Id/items/:productId", (req, res) => {
    const vendingMachineId = req.params.Id;
    const itemId = req.params.productId;

    const deleteVendingItemSQL = `
        DELETE FROM vending_machine.vending_item
        WHERE vending_machine_id = ? AND item_id = ?;
    `;

    const checkItemUsageSQL = `
        SELECT COUNT(*) AS count 
        FROM vending_machine.vending_item
        WHERE item_id = ?;
    `;

    const deleteItemSQL = `
        DELETE FROM vending_machine.item
        WHERE item_id = ?;
    `;

    db.query(deleteVendingItemSQL, [vendingMachineId, itemId], (err, result) => {
        if (err) {
            console.error("Error deleting vending item:", err);
            res.status(500).json({ error: "An error occurred while removing the item from the vending machine." });
            return;
        }

        if (result.affectedRows === 0) {
            res.status(404).json({ message: "Item not found in the specified vending machine." });
            return;
        }

        db.query(checkItemUsageSQL, [itemId], (err, checkResult) => {
            if (err) {
                console.error("Error checking item usage:", err);
                res.status(500).json({ error: "An error occurred while checking item usage." });
                return;
            }

            const usageCount = checkResult[0].count;

            if (usageCount === 0) {
                db.query(deleteItemSQL, [itemId], (err, deleteResult) => {
                    if (err) {
                        console.error("Error deleting item:", err);
                        res.status(500).json({ error: "An error occurred while deleting the item." });
                        return;
                    }

                    res.status(200).json({
                        message: "Item removed from the vending machine and deleted from the database.",
                    });
                });
            } else {
                res.status(200).json({
                    message: "Item removed from the vending machine but still in use in other machines.",
                });
            }
        });
    });
});
//add quantity modal
app.post("/vm_items/:vendingMachineId/items", (req, res) => {
    const { vendingMachineId } = req.params;
    const { item_id } = req.body;
    const { quantity } = req.body;

    if (!item_id) {
        return res.status(400).json({ message: "item ID is required" });
    }

    const sql = `
        INSERT INTO vending_machine.vending_item (vending_machine_id, item_id,quantity)
        VALUES (?, ?,?);
    `;

    db.query(sql, [vendingMachineId, item_id, quantity], (err, result) => {
        if (err) {
            console.error("Error adding product to vending machine:", err);
            return res.status(500).json({ message: "Error adding product to vending machine", error: err });
        }
        res.status(200).json({ message: "Product added to vending machine successfully" });
    });
});
// get product quantity
app.get("/vm_items/:item_id/:vm_id", (req, res) => {
    const itemId = req.params.item_id;
    const vm_id = req.params.vm_id;
    const query = `SELECT 
    i.item_id,
    i.item_name,
    vi.quantity as item_quantity
FROM 
    vending_machine.vending_item vi
JOIN 
    vending_machine.item i ON vi.item_id = i.item_id
WHERE 
    vi.item_id = ? AND vi.vending_machine_id = ?;
`;
    db.query(query, [itemId, vm_id], (error, results) => {
        if (error) {
            console.error("Error fetching item:", error);
            res.status(500).send("Internal Server Error");
        } else if (results.length === 0) {
            res.status(404).send("Item not found");
        } else {
            res.json(results[0]);
        }
    });
});
//edit quantity
app.put("/vm_items/item/:item_id/:vm_id", (req, res) => {
    const itemId = req.params.item_id;
    const vendingMachineId = req.params.vm_id;
    const { item_quantity } = req.body;

    const query = `
        UPDATE 
            vending_machine.vending_item 
        SET 
            quantity = ? 
        WHERE 
            item_id = ? AND vending_machine_id = ?;
    `;
    db.query(query, [item_quantity, itemId, vendingMachineId], (error, results) => {
        if (error) {
            console.error("Error updating item quantity:", error);
            res.status(500).send("Internal Server Error");
        } else if (results.affectedRows === 0) {
            res.status(404).send("Item not found");
        } else {
            res.status(200).send("Item quantity updated successfully");
        }
    });
});

/////////////////////item_2.html/////////////////////

app.get("/items", (req, res) => {
    const query = ` SELECT * FROM vending_machine.item i`;
    db.query(query, (err, results) => {
        if (err) {
            console.error("Error fetching products:", err);
            res.status(500).json({ error: "Failed to fetch products" });
        } else {
            res.json(results);
        }
    });
});
app.get("/search_items", (req, res) => {
    const searchQuery = req.query.search || "";
    const query = `SELECT * FROM vending_machine.item i
                     WHERE i.item_name LIKE ?;`;

    db.query(query, [`%${searchQuery}%`], (err, results) => {
        if (err) {
            res.status(500).json({ message: "Failed to fetch products" });
            return;
        }
        res.json(results);
    });
});
app.put("/items/:productId", upload.single("edit_item_image"), (req, res) => {
    const productId = req.params.productId;
    const { edit_item_name, edit_item_cost, edit_availability, edit_item_image } = req.body;

    const itemCost = parseFloat(edit_item_cost);
    const availability = edit_availability;

    let sqlUpdateProduct;
    let queryParams;

    if (req.file) {
        let newImageUrl = "/item_images/" + req.file.filename;
        sqlUpdateProduct = `
            UPDATE vending_machine.item
            SET item_name = ?, item_cost = ?, item_image = ? ,availability=?
            WHERE item_id = ?;
        `;
        queryParams = [edit_item_name, itemCost, newImageUrl, availability, productId];
    } else {
        sqlUpdateProduct = `
            UPDATE vending_machine.item
            SET item_name = ?, item_cost = ?,availability=?
            WHERE item_id = ?;
        `;
        queryParams = [edit_item_name, itemCost, availability, productId];
    }

    db.query(sqlUpdateProduct, queryParams, (error, result) => {
        if (error) {
            console.error("Error updating product:", error);
            return res.status(500).json({ message: "Error updating product", error });
        }

        res.status(200).json({ message: "Product updated successfully" });
    });
});

app.post("/items", upload.single("item_image"), (req, res) => {
    const { item_name, item_cost, availability } = req.body;

    if (!item_name || !item_cost === undefined || availability === undefined) {
        return res.status(400).json({ message: "All fields are required" });
    }

    const item_image_path = `/item_images/${req.file.filename}`;

    const checkProductSql = `
        SELECT item_id FROM vending_machine.item
        WHERE item_name = ? ;
    `;

    db.query(checkProductSql, [item_name], (checkError, checkResult) => {
        if (checkError) {
            console.error("Error checking product existence:", checkError);
            return res.status(500).json({ message: "Error checking product existence", error: checkError });
        }

        if (checkResult.length > 0) {
            const existingItemId = checkResult[0].item_id;
            return res.status(400).json({
                message: "Product already exists",
                item_id: existingItemId,
            });
        }

        const sqlInsert = `
            INSERT INTO vending_machine.item (item_name, item_cost, item_image, availability)
            VALUES (?, ?, ?, ?);
        `;

        db.query(sqlInsert, [item_name, item_cost, item_image_path, availability], (insertError, insertResult) => {
            if (insertError) {
                console.error("Error inserting product:", insertError);
                return res.status(500).json({ message: "Error inserting product", error: insertError });
            }
            res.status(200).json({ message: "Product added successfully" });
        });
    });
});

app.delete("/items/:productId", (req, res) => {
    const itemId = req.params.productId;

    const deleteItemSQL = `
        DELETE FROM vending_machine.item
        WHERE item_id = ?;
    `;
    db.query(deleteItemSQL, [itemId], (err, deleteResult) => {
        if (err) {
            console.error("Error deleting item:", err);
            res.status(500).json({ error: "An error occurred while deleting the item." });
            return;
        }

        res.status(200).json({
            message: "Item removed from the vending machine and deleted from the database.",
        });
    });
});

//////////////Report.html//////////////////////////
//report page fetch
app.get("/vendingMachine/low-stock", (req, res) => {
    const query = `
         SELECT i.item_name, vi.quantity AS item_quantity, vm.vendor_name AS vending_machine
        FROM vending_machine.item i
        JOIN vending_machine.vending_item vi ON i.item_id = vi.item_id
        JOIN vending_machine.vending_machine vm ON vi.vending_machine_id = vm.vending_machine_id
        WHERE vi.quantity <= 5;
    `;
    db.query(query, (err, results) => {
        if (err) {
            console.error(err);
            res.status(500).send("Failed to fetch low stock items");
        } else {
            res.json(results);
        }
    });
});

// Fetch most popular items (mocked with item quantity for now)
app.get("/vendingMachine/most-popular-items", (req, res) => {
    const query = `
        SELECT i.item_name, SUM(vi.quantity) AS total_quantity
        FROM vending_machine.item i
        JOIN vending_machine.vending_item vi ON i.item_id = vi.item_id
        GROUP BY i.item_name
        ORDER BY total_quantity DESC;
    `;

    db.query(query, (err, results) => {
        if (err) {
            console.error("Error fetching most popular items:", err);
            res.status(500).send("Failed to fetch most popular items");
        } else {
            res.json(results);
        }
    });
});

// Fetch vending machines per school
app.get("/vendingMachine/vending-machines-per-school", (req, res) => {
    const query = `
        SELECT l.school AS school_name, COUNT(vm.vending_machine_id) AS num_vending_machines
        FROM location l
        JOIN vending_machine vm ON l.location_id = vm.location_id
        GROUP BY l.school;
    `;
    db.query(query, (err, results) => {
        if (err) {
            console.error(err);
            res.status(500).send("Failed to fetch vending machines per school");
        } else {
            res.json(results);
        }
    });
});

// Start the server
app.listen(8080, "127.0.0.1", () => {
    console.log("Web server is running on http://127.0.0.1:8080");
});
