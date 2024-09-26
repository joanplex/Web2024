const express = require("express");

// Το module εξάγει μια συνάρτηση που δέχεται το αντικείμενο `db`
module.exports = (db) => {
    const router = express.Router();

    // Διαδρομή για την ανάκτηση όλων των ανακοινώσεων
    router.get("/", (req, res) => {
        const query = `
            SELECT 
                a.id, a.title, a.description, a.created_at,
                ai.item_id, ai.quantity,
                i.name AS item_name, i.category_id
            FROM announcements a
            LEFT JOIN announcement_items ai ON a.id = ai.announcement_id
            LEFT JOIN items i ON ai.item_id = i.id
            ORDER BY a.created_at DESC
        `;

        db.query(query, (err, results) => {
            if (err) {
                return res.status(500).json({ error: "Database query failed" });
            }

            // Group items by announcement
            const announcements = results.reduce((acc, row) => {
                if (!acc[row.id]) {
                    acc[row.id] = {
                        id: row.id,
                        title: row.title,
                        description: row.description,
                        created_at: row.created_at,
                        items: [],
                    };
                }
                if (row.item_id) {
                    acc[row.id].items.push({
                        id: row.item_id,
                        name: row.item_name,
                        quantity: row.quantity,
                        category_id: row.category_id,
                    });
                }
                return acc;
            }, {});

            return res.status(200).json(Object.values(announcements));
        });
    });

    // Διαδρομή για την ανάκτηση συγκεκριμένης ανακοίνωσης βάσει ID
    // Route to fetch a specific announcement by ID with its items
    router.get("/:id", (req, res) => {
        const { id } = req.params;

        const query = `
            SELECT 
                a.id, a.title, a.description, a.created_at,
                ai.item_id, ai.quantity,
                i.name AS item_name, i.category_id
            FROM announcements a
            LEFT JOIN announcement_items ai ON a.id = ai.announcement_id
            LEFT JOIN items i ON ai.item_id = i.id
            WHERE a.id = ?
        `;

        db.query(query, [id], (err, results) => {
            if (err) {
                return res.status(500).json({ error: "Database query failed" });
            }

            if (results.length === 0) {
                return res
                    .status(404)
                    .json({ error: "Announcement not found" });
            }

            const announcement = {
                id: results[0].id,
                title: results[0].title,
                description: results[0].description,
                created_at: results[0].created_at,
                items: results
                    .map((row) => ({
                        id: row.item_id,
                        name: row.item_name,
                        quantity: row.quantity,
                        category_id: row.category_id,
                    }))
                    .filter((item) => item.id !== null),
            };

            return res.status(200).json(announcement);
        });
    });

    // Διαδρομή για τη δημιουργία νέας ανακοίνωσης
    // Υποστηρίζει και σύνδεση των σχετικών items με τις αντίστοιχες ποσότητες (Βλ. announcements, announcement_items, items)
    router.post("/", (req, res) => {
        const { title, description, items } = req.body;
        if (!title || !description || !items || !Array.isArray(items)) {
            return res.status(400).send("Missing or invalid data");
        }

        db.beginTransaction((err) => {
            if (err) {
                return res.status(500).send("Error beginning transaction");
            }

            const insertAnnouncementQuery =
                "INSERT INTO announcements (title, description, created_at) VALUES (?, ?, NOW())";

            db.query(
                insertAnnouncementQuery,
                [title, description],
                (err, result) => {
                    if (err) {
                        return db.rollback(() => {
                            res.status(500).send("Error creating announcement");
                        });
                    }

                    const announcementId = result.insertId;
                    const insertItemsQuery =
                        "INSERT INTO announcement_items (announcement_id, item_id, quantity) VALUES ?";

                    const itemValues = items.map((item) => [
                        announcementId,
                        item.item_id,
                        item.quantity,
                    ]);

                    db.query(insertItemsQuery, [itemValues], (err) => {
                        if (err) {
                            return db.rollback(() => {
                                res.status(500).send(
                                    "Error adding items to announcement"
                                );
                            });
                        }

                        db.commit((err) => {
                            if (err) {
                                return db.rollback(() => {
                                    res.status(500).send(
                                        "Error committing transaction"
                                    );
                                });
                            }

                            return res.status(200).json({
                                success: true,
                                insertId: announcementId,
                            });
                        });
                    });
                }
            );
        });
    });

    // Διαδρομή για την ενημέρωση μιας ανακοίνωσης
    router.put("/:id", (req, res) => {
        const { id } = req.params;
        const { title, description, items } = req.body;

        if (!title || !description || !items || !Array.isArray(items)) {
            return res.status(400).json({ error: "Missing or invalid data" });
        }

        db.beginTransaction((err) => {
            if (err) {
                return res
                    .status(500)
                    .json({ error: "Error beginning transaction" });
            }

            // Update announcement details
            const updateAnnouncementQuery =
                "UPDATE announcements SET title = ?, description = ? WHERE id = ?";
            db.query(
                updateAnnouncementQuery,
                [title, description, id],
                (err) => {
                    if (err) {
                        return db.rollback(() => {
                            res.status(500).json({
                                error: "Error updating announcement",
                            });
                        });
                    }

                    // Delete existing items for this announcement
                    const deleteItemsQuery =
                        "DELETE FROM announcement_items WHERE announcement_id = ?";
                    db.query(deleteItemsQuery, [id], (err) => {
                        if (err) {
                            return db.rollback(() => {
                                res.status(500).json({
                                    error: "Error deleting existing items",
                                });
                            });
                        }

                        // Insert updated items
                        const insertItemsQuery =
                            "INSERT INTO announcement_items (announcement_id, item_id, quantity) VALUES ?";
                        const itemValues = items.map((item) => [
                            id,
                            item.item_id,
                            item.quantity,
                        ]);

                        db.query(insertItemsQuery, [itemValues], (err) => {
                            if (err) {
                                return db.rollback(() => {
                                    res.status(500).json({
                                        error: "Error inserting updated items",
                                    });
                                });
                            }

                            db.commit((err) => {
                                if (err) {
                                    return db.rollback(() => {
                                        res.status(500).json({
                                            error: "Error committing transaction",
                                        });
                                    });
                                }

                                return res.status(200).json({
                                    success: true,
                                    message:
                                        "Announcement and items updated successfully",
                                });
                            });
                        });
                    });
                }
            );
        });
    });

    // Διαδρομή για τη διαγραφή μιας ανακοίνωσης
    router.delete("/:id", (req, res) => {
        const { id } = req.params;
        db.beginTransaction((err) => {
            if (err) {
                return res
                    .status(500)
                    .json({ error: "Error beginning transaction" });
            }

            const deleteItemsQuery =
                "DELETE FROM announcement_items WHERE announcement_id = ?";
            db.query(deleteItemsQuery, [id], (err) => {
                if (err) {
                    return db.rollback(() => {
                        res.status(500).json({
                            error: "Error deleting announcement items",
                        });
                    });
                }

                const deleteAnnouncementQuery =
                    "DELETE FROM announcements WHERE id = ?";
                db.query(deleteAnnouncementQuery, [id], (err) => {
                    if (err) {
                        return db.rollback(() => {
                            res.status(500).json({
                                error: "Error deleting announcement",
                            });
                        });
                    }

                    db.commit((err) => {
                        if (err) {
                            return db.rollback(() => {
                                res.status(500).json({
                                    error: "Error committing transaction",
                                });
                            });
                        }

                        return res.status(200).json({
                            success: true,
                            message:
                                "Announcement and associated items deleted successfully",
                        });
                    });
                });
            });
        });
    });

    return router;
};
