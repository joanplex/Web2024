function editCategory(button) {
    const item = button.closest("li");

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

    attachEditCategory();

    showPopup("popupEditCategory");
}

// Create a new category
const attachCreateCategory = () => {
    document
        .getElementById("categoryForm")
        .addEventListener("submit", function (event) {
            event.preventDefault();

            const categoryTitle =
                document.getElementById("categoryTitle").value;
            console.log("Category Title:", categoryTitle);
            if (!categoryTitle.trim()) {
                alert("Το όνομα της κατηγορίας δεν μπορεί να είναι κενό.");
                return;
            }

            fetch("http://localhost:3000/api/categories", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    name: categoryTitle,
                }),
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
                    if (data.error) {
                        alert(data.error);
                    } else {
                        console.log("Category added:", data);
                        fetchCategories(); // Refresh the category list
                    }
                })
                .catch((error) =>
                    console.error("Error adding category:", error)
                );

            document.getElementById("categoryForm").reset();
            closePopup("popupCategory");
        });
};

// Υποβολή της φόρμας για επεξεργασία κατηγορίας
const attachEditCategory = () => {
    document
        .getElementById("editCategoryForm")
        .addEventListener("submit", function (event) {
            event.preventDefault();

            // Λήψη των νέων τιμών από τα input πεδία
            const categoryTitle =
                document.getElementById("editCategoryTitle").value;
            const categoryId = this.getAttribute("data-category-id"); // Από το attribute της φόρμας

            if (!categoryTitle.trim()) {
                alert("Το όνομα της κατηγορίας δεν μπορεί να είναι κενό.");
                return;
            }

            // Αποστολή του PUT request για την ενημέρωση της κατηγορίας
            fetch(`http://localhost:3000/api/categories/${categoryId}`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    name: categoryTitle,
                }),
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
                    console.log("Κατηγορία ενημερώθηκε:", data);
                    fetchCategories(); // Ενημέρωση της λίστας κατηγοριών
                })
                .catch((error) =>
                    console.error("Error updating category:", error)
                );

            closePopup("popupEditCategory");
        });
};

document.addEventListener("DOMContentLoaded", function () {
    attachCreateCategory();
});
