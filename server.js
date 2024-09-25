const express = require("express");
const mysql = require("mysql2");
const bodyParser = require("body-parser");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const cors = require("cors");
const path = require("path");
const app = express();

// αποθηκευτικός χώρος (=> κρατάμε το user)
const storage = require("node-persist");

// init storage
storage.init();

const __loggedInUserKey = "__loggedInUser";

app.use(bodyParser.json());
app.use(cors());
app.use(express.json());

const __project_root = __dirname;

// ------------------------- CACHE -------------------------------------------

// Middleware to set Cache-Control header
const setCacheControl = (req, res, next) => {
    if (
        req.method === "POST" ||
        req.method === "PUT" ||
        req.method === "DELETE" ||
        Object.keys(req.query).length > 0
    ) {
        res.set("Cache-control", "no-store");
    } else if (req.path.startsWith("/api/")) {
        res.set("Cache-control", `public, max-age=300, no-store`);
    } else {
        // Modify this line to include 'no-store' to prevent disk caching
        res.set("Cache-control", "public, max-age=31536000, no-store");
    }

    next();
};

// Use the middleware
app.use(setCacheControl);

// -----------------------------------------------------------------------------------

const dbOptions = {
    host: "127.0.0.1",
    user: "root",
    password: "Triwnierarxwn15!",
    database: "disaster_relief",
    port: 3306,
};

// Σύνδεση με τη βάση δεδομένων
const db = mysql.createConnection(dbOptions);

db.connect((err) => {
    if (err) {
        console.error("Error connecting to MySQL:", err);
        process.exit(1);
    } else {
        console.log("Connected to MySQL database");

        const announcements = require("./routes/announcements")(db);
        const requests = require("./routes/requests")(db, storage);
        const offers = require("./routes/offers")(db, storage);

        // TODO: να προσθέσουμε και τα υπόλοιπα για ναναι καθαρό
        app.use("/api/announcements", announcements);
        app.use("/api/requests", requests);
        app.use("/api/offers", offers);
    }
});

app.use(express.static(path.join(__project_root, "public")));
app.use(express.static(path.join(__project_root, "public/img")));

// Route handler for non-API routes
app.get("*.(html|css|js)", async (req, res, next) => {
    const route = req.url;

    console.log("-------- ROUTER --------------");

    if (
        route === "/login.html" ||
        route === "/register.html" ||
        route === "/logout.html"
    ) {
        // Strip .html from the URL
        req.url = req.url.replace(".html", "");
        return next();
    }

    try {
        console.log("EDW!");
        const user = await storage.getItem(__loggedInUserKey);
        console.log("GOT: ", user);

        // TODO: ...
        // console.log("SESSION: ", req.session);
        const role = user.role || "admin";
        const newUrl = path.join(__project_root, `/${role}/${route}`);

        res.sendFile(newUrl, (err) => {
            if (err) {
                res.sendFile(path.join(__project_root, "404.html"));
            }
        });
    } catch (ex) {
        res.sendFile(path.join(__project_root, "404.html"));
    }
});

app.get("/login", (req, res) => {
    res.sendFile(path.join(__project_root, "login.html"), (err) => {
        if (err) {
            res.sendFile(path.join(__project_root, "404.html"));
        }
    });
});

app.get("/register", (req, res) => {
    res.sendFile(path.join(__project_root, "register.html"), (err) => {
        if (err) {
            res.sendFile(path.join(__project_root, "404.html"));
        }
    });
});

app.get("/logout", async (req, res) => {
    // remove session
    await storage.setItem(__loggedInUserKey, null);
    console.log("logged-out!");
    // go back to login
    res.sendFile(path.join(__project_root, `login.html`));
});

// Route για την εγγραφή citizen (ΜΟΝΟ!)
app.post("/register", (req, res) => {
    const {
        username,
        firstName,
        lastName,
        password,
        phone,
        latitude,
        longitude,
    } = req.body;

    const role = "citizen";

    // Έλεγχος αν όλα τα πεδία είναι συμπληρωμένα
    if (!username || !password || !phone || !latitude || !longitude) {
        return res.json({
            success: false,
            message: "Παρακαλώ συμπληρώστε όλα τα πεδία.",
        });
    }

    // Κρυπτογράφηση του κωδικού πρόσβασης
    const hashedPassword = bcrypt.hashSync(password, 10);

    // SQL query για την εισαγωγή του νέου χρήστη
    const query =
        "INSERT INTO users (username, password, firstName, lastName, role, phone, latitude, longitude) VALUES (?, ?, ?, ?, ?, ?, ?, ?)";
    db.query(
        query,
        [
            username,
            hashedPassword,
            firstName,
            lastName,
            role,
            phone,
            latitude,
            longitude,
        ],
        (err, result) => {
            if (err) {
                console.error("Error inserting into database:", err);
                return res.status(500).json({
                    success: false,
                    message: "Registration failed",
                    error: err,
                });
            } else {
                console.log("User registered successfully");
                return res.json({
                    success: true,
                    message: "Registration successful",
                });
            }
        }
    );
});

// Route για το login χρηστών
app.post("/login", async (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.json({
            success: false,
            message:
                "Παρακαλώ συμπληρώστε το όνομα χρήστη και τον κωδικό πρόσβασης.",
        });
    }

    const trimmedUsername = username.trim() || "";
    const query = "SELECT * FROM users WHERE username = ?";

    try {
        const [results] = await db.promise().execute(query, [trimmedUsername]);

        if (results.length === 0) {
            return res
                .status(400)
                .json({ success: false, message: "Ο χρήστης δεν βρέθηκε" });
        }

        const user = results[0];
        const role = user.role || "admin";

        console.log("ROLOS: ", role);

        const passwordMatch = await bcrypt.compare(password, user.password);

        if (!passwordMatch) {
            return res.status(400).json({
                success: false,
                message: "Λανθασμένος κωδικός πρόσβασης",
            });
        }

        await storage.setItem(__loggedInUserKey, user);

        const token = jwt.sign({ id: user.id }, "your_jwt_secret_key", {
            expiresIn: "1h",
        });

        app.use(express.static(path.join(__project_root, `public/${role}`)));

        const redirectUrl =
            role === "admin"
                ? "/statusstorage.html"
                : role === "rescuer"
                ? "/manage.html"
                : "/announcements.html";

        return res.json({
            success: true,
            token,
            user: { id: user.id, username: user.username },
            redirectUrl,
        });
    } catch (err) {
        console.error("Error during login:", err);
        return res
            .status(500)
            .json({ success: false, message: "Σφάλμα κατά τη σύνδεση" });
    }
});

// Δημιουργία API Endpoint για ανάκτηση κατηγοριών
app.get("/api/categories", (req, res) => {
    // Το query υπολογίζει τον αριθμό των items για κάθε κατηγορία
    let sql = `
        SELECT categories.id, categories.name, COUNT(items.id) AS productCount
        FROM categories
        LEFT JOIN items ON categories.id = items.category_id
        GROUP BY categories.id, categories.name
    `;

    db.query(sql, (err, results) => {
        if (err) {
            return res.status(500).json({ error: "Database error" });
        }
        res.json(results);
    });
});

// Δημιουργία API Endpoint για προσθήκη νέας κατηγορίας
// Δημιουργία API Endpoint για προσθήκη νέας κατηγορίας
app.post("/api/categories", (req, res) => {
    console.log("Received request to add category:", req.body); // Debugging

    const categoryName = req.body.name;

    if (!categoryName || categoryName.trim() === "") {
        console.log("Category name is empty");
        return res.status(400).json({
            error: "Το όνομα της κατηγορίας δεν μπορεί να είναι κενό.",
        });
    }

    // Ανακτάμε το μέγιστο υπάρχον id
    const getMaxIdQuery = "SELECT MAX(id) as maxId FROM categories";
    db.query(getMaxIdQuery, (err, results) => {
        if (err) {
            console.error("Error retrieving max id:", err);
            return res
                .status(500)
                .json({ error: "Σφάλμα κατά την ανάκτηση του μέγιστου ID." });
        }

        const maxId = results[0].maxId || 0; // Αν δεν υπάρχουν κατηγορίες, ξεκινάμε από 0
        const nextId = maxId + 1; // Το νέο id θα είναι το μεγαλύτερο συν 1

        // Ελέγχουμε αν υπάρχει ήδη η κατηγορία
        const checkQuery = "SELECT * FROM categories WHERE name = ?";
        db.query(checkQuery, [categoryName], (err, results) => {
            if (err) {
                console.error("Database query error:", err);
                return res
                    .status(500)
                    .json({ error: "Σφάλμα στη βάση δεδομένων." });
            }

            if (results.length > 0) {
                console.log("Category already exists");
                return res
                    .status(400)
                    .json({ error: "Η κατηγορία υπάρχει ήδη." });
            } else {
                // Τώρα εισάγουμε τη νέα κατηγορία με το id που καθορίσαμε
                const insertQuery =
                    "INSERT INTO categories (id, name) VALUES (?, ?)";
                db.query(insertQuery, [nextId, categoryName], (err, result) => {
                    if (err) {
                        console.error("Error inserting into database:", err);
                        return res.status(500).json({
                            error: "Σφάλμα κατά την εισαγωγή στη βάση δεδομένων.",
                        });
                    }
                    console.log("Category added successfully:", result);
                    res.json({ id: nextId, name: categoryName });
                });
            }
        });
    });
});

// Δημιουργία API Endpoint για ανάκτηση αντικειμένων (items)
app.get("/api/items", (req, res) => {
    const sql = "SELECT * FROM items";
    db.query(sql, (err, results) => {
        if (err) throw err;
        res.json(results);
    });
});

// Δημιουργία API Endpoint για προσθήκη νέου αντικειμένου (item)
app.post("/api/items", (req, res) => {
    let { name, category_id, quantity, description } = req.body;

    console.log("BODY: ", req.body);

    if (!name || !category_id || !quantity || !description) {
        return res.status(500).json({ error: "Σφάλμα στη βάση δεδομένων." });
    }

    // Επεξεργασία της description για να αφαιρέσουμε τα περιττά κενά
    description = description.trim();

    const query =
        "INSERT INTO items (name, category_id, quantity, description) VALUES (?, ?, ?, ?)";
    db.query(
        query,
        [name, category_id, quantity, description],
        (err, result) => {
            if (err) {
                console.error(
                    "Σφάλμα κατά την εισαγωγή του αντικειμένου:",
                    err
                );
                return res
                    .status(500)
                    .json({ error: "Σφάλμα στη βάση δεδομένων." });
            }
            res.json({
                id: result.insertId,
                name,
                category_id,
                quantity,
                description,
            });
        }
    );
});
// Ενημέρωση κατηγορίας (PUT)
app.put("/api/categories/:id", (req, res) => {
    const categoryId = req.params.id;
    const { name } = req.body;

    if (!name || name.trim() === "") {
        return res.status(400).json({
            error: "Το όνομα της κατηγορίας δεν μπορεί να είναι κενό.",
        });
    }

    const updateQuery = "UPDATE categories SET name = ? WHERE id = ?";
    db.query(updateQuery, [name, categoryId], (err, result) => {
        if (err) {
            console.error("Σφάλμα κατά την ενημέρωση της κατηγορίας:", err);
            return res
                .status(500)
                .json({ error: "Σφάλμα στη βάση δεδομένων." });
        }
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: "Η κατηγορία δεν βρέθηκε." });
        }
        res.json({
            success: true,
            message: "Η κατηγορία ενημερώθηκε επιτυχώς.",
        });
    });
});

// Ενημέρωση προϊόντος (PUT)
app.put("/api/items/:id", (req, res) => {
    const itemId = req.params.id;
    let { name, quantity, description, category_id, vqitem } = req.body;

    // Έλεγχος για κενά πεδία
    if (!name || !quantity || !description || !vqitem || !category_id) {
        return res
            .status(400)
            .json({ error: "Όλα τα πεδία είναι υποχρεωτικά." });
    }

    // Έλεγχος για την περιγραφή, ότι είναι string και γίνεται trim για απομάκρυνση επιπλέον κενών
    if (description && typeof description === "string") {
        description = description.trim();
    }

    // Έλεγχος για τα αριθμητικά πεδία (quantity και vqitem)
    if (isNaN(quantity) || isNaN(vqitem)) {
        return res.status(400).json({
            error: "Η ποσότητα και η ποσότητα προς διακίνηση πρέπει να είναι αριθμοί.",
        });
    }

    // Βεβαιωθείτε ότι η ποσότητα προς διακίνηση (vqitem) δεν είναι μεγαλύτερη από τη συνολική ποσότητα (quantity)
    if (vqitem > quantity) {
        return res.status(400).json({
            error: "Η ποσότητα προς διακίνηση δεν μπορεί να υπερβαίνει τη συνολική ποσότητα.",
        });
    }

    // Query για ενημέρωση του προϊόντος
    const updateQuery =
        "UPDATE items SET name = ?, quantity = ?, description = ?, vqitem = ?, category_id = ? WHERE id = ?";

    db.query(
        updateQuery,
        [name, quantity, description, vqitem, category_id, itemId],
        (err, result) => {
            if (err) {
                console.error("Σφάλμα κατά την ενημέρωση του προϊόντος:", err);
                return res
                    .status(500)
                    .json({ error: "Σφάλμα στη βάση δεδομένων." });
            }

            // Έλεγχος αν το προϊόν υπάρχει
            if (result.affectedRows === 0) {
                return res
                    .status(404)
                    .json({ error: "Το προϊόν δεν βρέθηκε." });
            }

            // Επιτυχής ενημέρωση
            res.json({
                success: true,
                message: "Το προϊόν ενημερώθηκε επιτυχώς.",
            });
        }
    );
});

// Διαγραφή κατηγορίας
app.delete("/api/categories/:id", (req, res) => {
    const categoryId = req.params.id;

    // Ελέγχουμε αν υπάρχουν προϊόντα που ανήκουν στην κατηγορία
    const checkItemsQuery = "SELECT * FROM items WHERE category_id = ?";
    db.query(checkItemsQuery, [categoryId], (err, results) => {
        if (err) {
            return res
                .status(500)
                .json({ error: "Σφάλμα στη βάση δεδομένων." });
        }

        if (results.length > 0) {
            return res.status(400).json({
                error: "Δεν μπορείτε να διαγράψετε αυτή την κατηγορία. Υπάρχουν προϊόντα που ανήκουν σε αυτήν.",
            });
        }

        // Αν δεν υπάρχουν προϊόντα, προχωράμε στη διαγραφή της κατηγορίας
        const query = "DELETE FROM categories WHERE id = ?";
        db.query(query, [categoryId], (err, result) => {
            if (err) {
                return res
                    .status(500)
                    .json({ error: "Σφάλμα κατά τη διαγραφή της κατηγορίας." });
            }
            res.json({
                success: true,
                message: "Η κατηγορία διαγράφηκε επιτυχώς.",
            });
        });
    });
});

// Διαγραφή προϊόντος
app.delete("/api/items/:id", (req, res) => {
    const itemId = req.params.id;

    const query = "DELETE FROM items WHERE id = ?";
    db.query(query, [itemId], (err, result) => {
        if (err) {
            return res
                .status(500)
                .json({ error: "Σφάλμα κατά τη διαγραφή του προϊόντος." });
        }
        res.json({ success: true, message: "Το προϊόν διαγράφηκε επιτυχώς." });
    });
});

//Αποθετήριο
app.post("/api/import-data", async (req, res) => {
    const { url: phpUrl } = req.body;

    if (!phpUrl) {
        return res.status(400).json({ error: "Το URL είναι απαραίτητο." });
    }

    try {
        // Κλήση στο PHP αρχείο μέσω του URL
        const response = await fetch(phpUrl);
        const data = await response.json();

        // Εισαγωγή δεδομένων από το JSON
        if (data.categories) {
            // Εισαγωγή κατηγοριών
            data.categories.forEach((category) => {
                // Αν υπάρχει id από την PHP, χρησιμοποιούμε το id, αλλιώς το αφήνουμε να το αναθέσει η MySQL
                const query = category.id
                    ? `INSERT INTO categories (id, name) VALUES (?, ?) ON DUPLICATE KEY UPDATE name = VALUES(name)`
                    : `INSERT INTO categories (name) VALUES (?) ON DUPLICATE KEY UPDATE name = VALUES(name)`;

                const params = category.id
                    ? [category.id, category.category_name]
                    : [category.category_name];

                db.query(query, params, (err) => {
                    if (err) console.error("Error inserting category:", err);
                });
            });
        }

        if (data.items) {
            // Εισαγωγή προϊόντων
            data.items.forEach((item) => {
                const query = `INSERT INTO items (id, name, category_id, quantity) VALUES (?, ?, ?, ?) ON DUPLICATE KEY UPDATE name = VALUES(name), category_id = VALUES(category_id)`;
                db.query(
                    query,
                    [item.id, item.name, item.category, 0],
                    (err) => {
                        if (err) console.error("Error inserting item:", err);
                    }
                );
            });
        }

        res.json({ message: "Επιτυχής εισαγωγή δεδομένων." });
    } catch (error) {
        console.error("Error fetching or importing data:", error);
        res.status(500).json({ error: "Σφάλμα κατά την εισαγωγή δεδομένων." });
    }
});

// Διαδρομή για την εισαγωγή δεδομένων από το αρχείο JSON
app.post("/api/import-json", (req, res) => {
    const jsonData = req.body; // Υποθέτουμε ότι το json αποστέλλεται σωστά στο σώμα του αιτήματος

    if (!jsonData) {
        return res
            .status(400)
            .json({ message: "Δεν υπάρχουν δεδομένα στο αρχείο JSON." });
    }

    const { categories, items } = jsonData;

    // Εισαγωγή κατηγοριών στη βάση δεδομένων
    if (categories && categories.length > 0) {
        categories.forEach((category) => {
            const categoryName = category.category_name;

            // Έλεγχος αν υπάρχει η κατηγορία
            const insertCategoryQuery =
                "INSERT INTO categories (name) VALUES (?) ON DUPLICATE KEY UPDATE name = VALUES(name)";
            db.query(insertCategoryQuery, [categoryName], (err, result) => {
                if (err) {
                    console.error("Σφάλμα κατά την εισαγωγή κατηγορίας:", err);
                } else {
                    console.log(
                        `Επιτυχής εισαγωγή κατηγορίας: ${categoryName}`
                    );
                }
            });
        });
    }

    // Εισαγωγή ειδών στη βάση δεδομένων
    if (items && items.length > 0) {
        items.forEach((item) => {
            const itemName = item.name;
            const categoryId = item.category; // Υποθέτουμε ότι η αντιστοιχία κατηγορίας γίνεται με το id
            const quantity = 0; // Εφόσον δεν υπάρχει quantity στο JSON

            if (!itemName || !categoryId) {
                console.error(
                    "Λείπει το όνομα ή η κατηγορία για το είδος:",
                    item
                );
                return;
            }

            const insertItemQuery =
                "INSERT INTO items (name, category_id, quantity) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE name = VALUES(name)";
            db.query(
                insertItemQuery,
                [itemName, categoryId, quantity],
                (err, result) => {
                    if (err) {
                        console.error("Σφάλμα κατά την εισαγωγή είδους:", err);
                    } else {
                        console.log(`Επιτυχής εισαγωγή είδους: ${itemName}`);
                    }
                }
            );
        });
    }
    console.log("Επεξεργασία είδους:", item);
    res.json({
        message: "Τα δεδομένα εισήχθησαν επιτυχώς στη βάση δεδομένων.",
    });
});

//
//  RESCUERS SUPPORT
//

// Route για φόρτωση της κατάστασης αποθήκης
app.get("/warehouse-status", (req, res) => {
    const sql = "SELECT id, name, category_id, vqitem FROM items"; // Τροποποιημένο SQL ερώτημα για να πάρεις τα προϊόντα της αποθήκης
    db.query(sql, (err, results) => {
        if (err) {
            return res.status(500).json({
                success: false,
                message: "Σφάλμα κατά τη φόρτωση των προϊόντων",
            });
        }
        res.json({ success: true, items: results });
    });
});
// Route για ανάκτηση της τελευταίας τοποθεσίας του οχήματος
app.get("/vehicle-location/:vehicleId", (req, res) => {
    const vehicleId = req.params.vehicleId;

    const sql = "SELECT location_lat, location_lng FROM vehicles WHERE id = ?";
    db.query(sql, [vehicleId], (err, result) => {
        if (err) {
            console.error("Σφάλμα κατά την ανάκτηση τοποθεσίας:", err);
            return res.status(500).json({
                success: false,
                message: "Σφάλμα κατά την ανάκτηση τοποθεσίας",
            });
        }

        if (result.length > 0) {
            res.json({ success: true, location: result[0] });
        } else {
            res.status(404).json({
                success: false,
                message: "Το όχημα δεν βρέθηκε",
            });
        }
    });
});
// Διαδρομή για ενημέρωση τοποθεσίας οχήματος
app.post("/update-vehicle-location", (req, res) => {
    console.log("Received data:", req.body); // Ελέγχουμε τα δεδομένα που φτάνουν στον server

    const { lat, lng, vehicleId } = req.body;

    if (!lat || !lng || !vehicleId) {
        return res
            .status(400)
            .json({ success: false, message: "Μη έγκυρα δεδομένα" });
    }

    const sql =
        "UPDATE vehicles SET location_lat = ?, location_lng = ?, last_update = NOW() WHERE id = ?";
    db.query(sql, [lat, lng, vehicleId], (err, results) => {
        if (err) {
            console.error("Σφάλμα κατά την ενημέρωση της τοποθεσίας:", err);
            return res.status(500).json({
                success: false,
                message: "Σφάλμα κατά την ενημέρωση της τοποθεσίας",
            });
        }
        res.json({
            success: true,
            message: "Η τοποθεσία ενημερώθηκε επιτυχώς",
        });
    });
});

//
//-----------------------------------------------------------------------------
//

app.get("/api/vehicles", (req, res) => {
    const query = "SELECT * FROM vehicles";
    db.query(query, (err, results) => {
        if (err) {
            console.error("Error executing query:", err);

            return res
                .status(500)
                .json({ error: "An error occurred while fetching data" });
        }

        res.json(results);
    });
});

app.get("/api/vehicles/active", (req, res) => {
    const query = "SELECT * FROM vehicles WHERE status = 'active' ";

    db.query(query, (err, results) => {
        if (err) {
            console.error("Error executing query:", err);

            return res
                .status(500)
                .json({ error: "An error occurred while fetching data" });
        }

        res.json(results);
    });
});

app.get("/api/vehicles/inactive", (req, res) => {
    const query = "SELECT * FROM vehicles WHERE status = 'inactive' ";
    db.query(query, (err, results) => {
        if (err) {
            console.error("Error executing query:", err);

            return res
                .status(500)
                .json({ error: "An error occurred while fetching data" });
        }

        res.json(results);
    });
});

app.get("/api/offers", (req, res) => {
    const query = "SELECT * FROM offers";
    db.query(query, (err, results) => {
        if (err) {
            console.error("Error executing query:", err);

            return res
                .status(500)
                .json({ error: "An error occurred while fetching data" });
        }

        res.json(results);
    });
});

//
//  ------ RESCUERS ------
//

// Route to add a new rescuer to the users table
app.get("/api/rescuers", (req, res) => {
    const query = "SELECT * FROM users WHERE role = ?";

    db.query(query, ["rescuer"], (err, result) => {
        if (err) {
            console.log("error: ", err);

            return res
                .status(500)
                .json({ error: "Error adding rescuer to database" });
        }

        res.json(result);
    });
});

app.post("/api/rescuers", (req, res) => {
    const { firstName, lastName, email, password } = req.body;

    const role = "rescuer";

    const query =
        "INSERT INTO users (firstName, lastName, username, password, role) VALUES (?, ?, ?, ?, ?)";

    db.query(
        query,
        [firstName, lastName, email, password, role],
        (err, result) => {
            if (err) {
                console.log("error: ", err);

                return res
                    .status(500)
                    .json({ error: "Error adding rescuer to database" });
            }
            res.json({ id: result.insertId, firstName, lastName, email, role });
        }
    );
});

const port = 3000;

app.listen(port, () => {
    console.log(`Server running at http://localhost:3000`);
});
