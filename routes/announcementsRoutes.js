const express = require("express");

// Το module εξάγει μια συνάρτηση που δέχεται το αντικείμενο `db`
module.exports = (db) => {
    const router = express.Router();

    // Διαδρομή για την ανάκτηση όλων των ανακοινώσεων
    router.get("/announcements", (req, res) => {
        const query = "SELECT * FROM announcements";
        db.query(query, (err, results) => {
            if (err) {
                return res.status(500).json({ error: "Database query failed" });
            }
            res.json(results); // Επιστροφή των αποτελεσμάτων σε JSON
        });
    });
    // Διαδρομή για την ανάκτηση συγκεκριμένης ανακοίνωσης βάσει ID
    router.get("/announcements/:id", (req, res) => {
        const { id } = req.params;
        const query = "SELECT * FROM announcements WHERE id = ?";
        db.query(query, [id], (err, results) => {
            if (err) {
                return res.status(500).json({ error: "Database query failed" });
            }
            if (results.length === 0) {
                return res
                    .status(404)
                    .json({ error: "Announcement not found" });
            }
            res.json(results[0]);
        });
    });

    // Διαδρομή για τη δημιουργία νέας ανακοίνωσης
    router.post("/announcements", (req, res) => {
        console.log(req.body); // Δες τι περιέχει το req.body
        const { title, description } = req.body;
        if (!title || !description) {
            return res.status(400).send("Missing title or description");
        }
        const query =
            "INSERT INTO announcements (title, description, created_at) VALUES (?, ?, NOW())";
        db.query(query, [title, description], (err, result) => {
            if (err) {
                return res.status(500).send("Error creating announcement.");
            }
            res.json({ success: true, insertId: result.insertId });
        });
    });

    // Διαδρομή για την ενημέρωση μιας ανακοίνωσης
    router.put("/announcements/:id", (req, res) => {
        const { id } = req.params;
        const { title, description } = req.body;
        const query =
            "UPDATE announcements SET title = ?, description = ? WHERE id = ?";
        db.query(query, [title, description, id], (err) => {
            if (err) {
                return res.status(500).send("Error updating announcement.");
            }
            res.json({ success: true });
        });
    });

    // Διαδρομή για τη διαγραφή μιας ανακοίνωσης
    router.delete("/announcements/:id", (req, res) => {
        const { id } = req.params;
        const query = "DELETE FROM announcements WHERE id = ?";
        db.query(query, [id], (err) => {
            if (err) {
                return res.status(500).send("Error deleting announcement.");
            }
            res.json({ success: true });
        });
    });

    return router;
};
