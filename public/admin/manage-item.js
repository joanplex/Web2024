function editItem(button) {
    const item = button.closest("li");

    const titleElement = item.querySelector(".item-title");
    const quantityElement = item.querySelector(".item-quantity");

    // Ελέγξτε αν τα στοιχεία υπάρχουν πριν επιχειρήσετε να διαβάσετε τις τιμές τους
    if (!titleElement || !quantityElement) {
        console.error(
            "Το στοιχείο δεν βρέθηκε. Βεβαιωθείτε ότι υπάρχουν όλα τα απαιτούμενα στοιχεία."
        );
        return;
    }

    const title = titleElement.textContent;
    const quantity = quantityElement.textContent;

    // Φόρτωση των στοιχείων είδους στο pop-up
    document.getElementById("editTitle").value = title;
    document.getElementById("editQuantity").value = quantity;
    document.getElementById("editDescription").value = item.description; // Προσθήκη περιγραφής
    document.getElementById("editVqItem").value = item.vqitem; // Εάν προσθέσεις και ποσότητα για διακίνηση

    attachEditItem();

    // Αποθήκευση της αναφοράς στο συγκεκριμένο είδος για μελλοντική ενημέρωση
    document
        .getElementById("editItemForm")
        .setAttribute("data-item-id", item.dataset.itemId);

    attachEditItem();

    showPopup("popupEditItem");
}

function deleteItem(button) {
    const item = button.closest("li");
    const itemId = item.getAttribute("data-item-id");

    const confirmation = confirm(
        `Είσαι σίγουρος ότι θέλεις να διαγράψεις αυτό το είδος;`
    );
    if (confirmation) {
        fetch(`http://localhost:3000/api/items/${itemId}`, {
            method: "DELETE",
        })
            .then((response) => {
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                console.log(`Το είδος διαγράφηκε επιτυχώς`);
                item.remove(); // Αφαιρούμε το στοιχείο από το DOM
            })
            .catch((error) => console.error("Error deleting item:", error));
    }
}

// Υποβολή της φόρμας για επεξεργασία είδους
const attachEditItem = () => {
    document
        .getElementById("editItemForm")
        .addEventListener("submit", function (event) {
            event.preventDefault();

            // Fetch the values from the input fields
            const name = document.getElementById("editTitle").value.trim();
            const quantity = document.getElementById("editQuantity").value;

            const editCategorySelect = document.getElementById("editCategory");

            const category_id =
                editCategorySelect.options[editCategorySelect.selectedIndex]
                    .value;
            const vqitem = document.getElementById("editVqItem").value; // Fetch vqitem

            let description = document
                .getElementById("editDescription")
                .value.trim(); // Fetch description

            const itemId = this.getAttribute("data-item-id"); // The ID of the item being edited

            // Validate that all fields are filled
            if (!name || !quantity || !vqitem || !description || !category_id) {
                alert("Όλα τα πεδία είναι υποχρεωτικά.");
                return;
            }

            // Make the PUT request to update the item
            fetch(`http://localhost:3000/api/items/${itemId}`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    name,
                    category_id,
                    quantity: parseInt(quantity), // Βεβαιωνόμαστε ότι τα στέλνουμε ως αριθμούς
                    vqitem: parseInt(vqitem), // Βεβαιωνόμαστε ότι τα στέλνουμε ως αριθμούς
                    description: description,
                }),
            })
                .then((res) => res.json())
                .then((data) => {
                    console.log("Item updated:", data);

                    fetchItems();

                    closePopup("popupEditItem"); // Close the popup window after update
                })
                .catch((error) => console.error("Error updating item:", error));
        });
};

// Create a new item
function attachCreateItem() {
    document
        .getElementById("itemForm")
        .addEventListener("submit", async function (event) {
            event.preventDefault();

            const name = document.getElementById("title").value.trim(); // Trim title input

            const categorySelect = document.getElementById("category");

            const category_id =
                categorySelect.options[categorySelect.selectedIndex].value;

            const quantity = document.getElementById("quantity").value;

            const description = document
                .getElementById("description")
                .value.trim(); // Trim description input

            // Validate fields before sending
            if (!name || !quantity || !category_id || !description) {
                alert("Όλα τα πεδία είναι υποχρεωτικά.");
                return;
            }

            const body = {
                name,
                category_id,
                quantity,
                description,
            };

            fetch("http://localhost:3000/api/items", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(body),
            })
                .then((response) => {
                    if (!response.ok) {
                        throw new Error(
                            `HTTP error! status: ${response.status}`
                        );
                    }
                    return response.json();
                })
                .then((data) => {
                    console.log("Item added:", data);

                    fetchItems(); // Refresh the item list

                    // Κλείσιμο του popup
                    closePopup("popupItem");
                })
                .catch((error) => console.error("Error adding item:", error));
        });
}

const addCategoryOption = (c) => {
    const categorySelect = document.getElementById("category");
    const option = document.createElement("option");
    option.value = c.id; // Set the option value to category id
    option.innerHTML = c.name;
    categorySelect.appendChild(option);
};

const attachOnOpen = () => {
    const categorySelect = document.getElementById("category");

    categorySelect.addEventListener("focus", async (e) => {
        e.preventDefault();

        categorySelect.innerHTML = ""; // clear

        const res = await fetch("http://localhost:3000/api/categories");
        if (!res.ok) return;

        const categories = (await res.json()) || [];
        if (categories.length === 0) return;

        categories.forEach(addCategoryOption);
    });
};

// --------------------------------------------------------------

// --- copy paste για το edit category ---

const addCategoryOption2 = (c) => {
    const editCategorySelect = document.getElementById("editCategory");
    const option = document.createElement("option");
    option.value = c.id; // Set the option value to category id
    option.innerHTML = c.name;
    editCategorySelect.appendChild(option);
};

const attachOnOpen2 = () => {
    const editCategorySelect = document.getElementById("editCategory");

    editCategorySelect.addEventListener("focus", async (e) => {
        e.preventDefault();

        editCategorySelect.innerHTML = ""; // clear

        const res = await fetch("http://localhost:3000/api/categories");
        if (!res.ok) return;

        const categories = (await res.json()) || [];
        if (categories.length === 0) return;

        categories.forEach(addCategoryOption2);
    });
};

function fetchItems() {
    fetch("http://localhost:3000/api/items", {
        method: "GET",
    })
        .then((response) => response.json())
        .then((data) => {
            const itemsList = document.querySelector(".items ul"); // Ensure this is the correct selector for your items list
            itemsList.innerHTML = ""; // Clear current items

            data.forEach((item) => {
                const newItem = document.createElement("li");
                newItem.setAttribute("data-item-id", item.id);
                newItem.innerHTML = `
                <span class="item-title">${item.name}</span> - 
                <span class="item-quantity">${item.quantity}</span> ποσότητα
                <span class="dots" onclick="showMenu(this)">•••</span>
                <div class="menu">
                    <button onclick="editItem(this)">Επεξεργασία</button>
                    <button class="delete-btn" onclick="deleteItem(this, 'item')">Διαγραφή</button>
                </div>
            `;
                itemsList.appendChild(newItem);
            });
        })
        .catch((error) => console.error("Error fetching items:", error));
}

// --------------------------------------------------------------

document.addEventListener("DOMContentLoaded", function () {
    attachCreateItem();
    attachOnOpen();
    attachOnOpen2();
});
