// Εμφάνιση του popup window
function showPopup(popupId) {
    document.getElementById(popupId).style.display = "block";
    document.body.classList.add("popup-active"); // Προσθήκη κλάσης για απενεργοποίηση άλλων στοιχείων
}

// Κλείσιμο του popup window
function closePopup(popupId) {
    document.getElementById(popupId).style.display = "none";
    document.body.classList.remove("popup-active"); // Αφαίρεση της κλάσης για επαναφορά αλληλεπίδρασης
}

// Εμφάνιση του μενού όταν πατάμε στα dots
function showMenu(element) {
    const menu = element.nextElementSibling;
    // Εμφάνιση/απόκρυψη του μενού
    if (menu.style.display === "block") {
        menu.style.display = "none";
    } else {
        // Πρώτα κρύβουμε οποιαδήποτε άλλα μενού είναι ανοιχτά
        document
            .querySelectorAll(".menu")
            .forEach((m) => (m.style.display = "none"));
        menu.style.display = "block";
    }
}

// Επεξεργασία κατηγορίας ή είδους
function editItem(button, type) {
    const item = button.closest("li");

    if (type === "item") {
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

        showPopup("popupEditItem");
    } else if (type === "category") {
        const categoryTitleElement = item.querySelector(".category-title");

        if (!categoryTitleElement) {
            console.error("Το στοιχείο της κατηγορίας δεν βρέθηκε.");
            return;
        }

        const categoryTitle = categoryTitleElement.textContent;

        document.getElementById("editCategoryTitle").value = categoryTitle;
        document
            .getElementById("editCategoryForm")
            .setAttribute("data-category-id", item.dataset.categoryId);

        showPopup("popupEditCategory");
    }
}

// Διαγραφή είδους / Κατηγοριας
async function deleteCategory(button) {
    const item = button.closest("li");
    const categoryId = item.getAttribute("data-category-id");

    const confirmation = confirm(
        `Είσαι σίγουρος ότι θέλεις να διαγράψεις αυτή την κατηγορία;`
    );

    if (confirmation) {
        const res = await fetch(
            `http://localhost:3000/api/categories/${categoryId}`,
            {
                method: "DELETE",
            }
        );

        if (res.status === 400)
            alert(
                "Η κατηγορία αυτή περιέχει είδη και δεν μπορεί να διαγραφεί!"
            );

        if (!res.ok) {
            return;
        }

        item.remove(); // Αφαιρούμε το στοιχείο από το DOM
    }
}

// Fetch categories from the server
function fetchCategories() {
    fetch("http://localhost:3000/api/categories", {
        method: "GET",
    })
        .then((response) => response.json())
        .then((data) => {
            console.log("Data fetched from API:", data);

            const categoriesList = document.querySelector(".categories ul");
            categoriesList.innerHTML = ""; // Clear current categories

            data.forEach((category) => {
                const newCategory = document.createElement("li");
                newCategory.setAttribute("data-category-id", category.id);
                newCategory.innerHTML = `
                    <span class="category-title">${category.name}</span> 
                    (${
                        category.productCount || 0
                    } είδη) <!-- Εμφάνιση του αριθμού των items -->
                    <span class="dots" onclick="showMenu(this)">•••</span>
                    <div class="menu">
                        <button onclick="editCategory(this)">Επεξεργασία</button>
                        <button class="delete-btn" onclick="deleteCategory(this, 'category')">Διαγραφή</button>
                    </div>
                `;
                categoriesList.appendChild(newCategory);

                // Προσθήκη της κατηγορίας στο select dropdown
                // const option = document.createElement("option");
                // option.value = category.id;
                // option.textContent = `${category.name} (${
                //     category.productCount || 0
                // } είδη)`; // Εμφάνιση αριθμού προϊόντων
                // categorySelect.appendChild(option);
            });
        })
        .catch((error) => console.error("Error fetching categories:", error));
}

// Fetch items from the server
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

// Fetch δεδομένα κατά την αρχική φόρτωση
document.addEventListener("DOMContentLoaded", function () {
    fetchCategories();
    fetchItems();

    // Φιλτράρισμα κατηγοριών κατά την πληκτρολόγηση στη μπάρα αναζήτησης
    document
        .getElementById("categorySearch")
        .addEventListener("input", function () {
            const searchValue = this.value.toLowerCase();
            const categoryItems =
                document.querySelectorAll(".categories ul li");

            categoryItems.forEach(function (item) {
                const categoryName = item
                    .querySelector(".category-title")
                    .textContent.toLowerCase();
                if (categoryName.includes(searchValue)) {
                    item.style.display = ""; // Εμφάνιση
                } else {
                    item.style.display = "none"; // Απόκρυψη
                }
            });
        });

    // Φιλτράρισμα ειδών κατά την πληκτρολόγηση στη μπάρα αναζήτησης
    document
        .getElementById("itemSearch")
        .addEventListener("input", function () {
            const searchValue = this.value.toLowerCase();
            const itemElements = document.querySelectorAll(".items ul li");

            itemElements.forEach(function (item) {
                const itemName = item
                    .querySelector(".item-title")
                    .textContent.toLowerCase();
                if (itemName.includes(searchValue)) {
                    item.style.display = ""; // Εμφάνιση
                } else {
                    item.style.display = "none"; // Απόκρυψη
                }
            });
        });
});
