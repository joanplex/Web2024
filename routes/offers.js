const express = require("express");

const __loggedInUserKey = "__loggedInUser";

module.exports = (db, storage) => {
    const router = express.Router();

    // ----------------------------------------------------------------------

    const getCategoryNameForId = async (category_id) => {
        const sql = `
        SELECT * FROM categories WHERE id = ?
    `;

        const [results] = await db.promise().execute(sql, [category_id]);

        if (results.length !== 1) return null;

        console.log("CATEGORY: ", results[0].name);

        return results[0].name;
    };

    const getItemForId = async (item_id) => {
        const sql = `
         SELECT * FROM items WHERE id = ?
     `;

        const [results] = await db.promise().execute(sql, [item_id]);

        if (results.length !== 1) return null;

        const { category_id } = results[0];

        return {
            ...results[0],
            category: (await getCategoryNameForId(category_id)) || "-",
        };
    };

    const getOfferRes = async (r) => {
        const { item_id, ...other } = r;

        return {
            ...other,
            item: (await getItemForId(item_id)) || {},
        };
    };

    // ----------------------------------------------------------------------

    router.get("/", async (req, res) => {
        const query = "SELECT * FROM offers";

        const [results] = await db.promise().execute(query);
        const all = await Promise.all(results.map(getOfferRes));

        return res.status(200).json(all);
    });

    router.post("/:id/cancel", async (req, res) => {
        try {
            const id = req.params.id;
            const updateQuery =
                "UPDATE offers SET status = 'cancelled' WHERE id = ?";

            const [result] = await db.promise().execute(updateQuery, [id]);

            if (result.affectedRows === 0) {
                return res.status(404).json({ error: "Request not found" });
            }

            return res
                .status(200)
                .json({ message: "Request cancelled successfully" });
        } catch (error) {
            console.error("Error cancelling request:", error);

            return res.status(500).json({
                error: "An error occurred while cancelling the request",
            });
        }
    });

    router.post("/", async (req, res) => {
        try {
            const currentCitizen = await storage.getItem(__loggedInUserKey);
            if (!currentCitizen)
                return res.status(400).json({ error: "Could not get citizen" });

            const { item_id, quantity } = req.body;

            console.log("GOT: ", req.body);

            // Validate input
            if (!item_id || !quantity) {
                return res
                    .status(400)
                    .json({ error: "Missing required fields" });
            }

            // Insert the new request
            await db
                .promise()
                .execute(
                    "INSERT INTO offers (user_id, item_id, quantity, status) VALUES (?, ?, ?, ?)",
                    [currentCitizen.id, item_id, quantity, "pending"]
                );

            // Return the newly created request ID
            return res.status(200).json({ ok: true });
        } catch (error) {
            console.error("Error creating request:", error);
            return res.status(500).json({
                error: "An error occurred while creating the request",
            });
        }
    });

    return router;
};
