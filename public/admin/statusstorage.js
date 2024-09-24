const getCategoryForId = (category_id, categories) =>
    categories.find(({ id }) => id === category_id).name || "";

const fetchItemsList = async () => {
    const res0 = await fetch("http://localhost:3000/api/categories");
    if (!res0.ok) return null;
    const categories = await res0.json();

    const res1 = await fetch("http://localhost:3000/api/items");
    if (!res1.ok) return null;
    const items = await res1.json();

    // Αντιστοίχιση category_id σε όνομα κατηγορίας (που μπορεί να διαβαστεί από άνθρωπο)
    return items.map(({ category_id, ...item }) => ({
        ...item,
        category: getCategoryForId(category_id, categories),
    }));
};

const getCategoryClass = (category) => {
    // Δυο απαραίτητες κλάσεις για το χρωματισμό στήλης Κατηγορία
    return `category other ${category.replace(" ", "_")}`;
};

const renderItems = (items) => {
    const productList = document.getElementById("productList");
    productList.innerHTML = ""; // Καθαρισμός της λίστας

    items.forEach((item) => {
        const row = `
<tr>
    <td>${item.name}</td>
    <td>
        <span class="${getCategoryClass(item.category)}">${item.category}</span>
    </td>
    <td>${item.description || "-"}</td>
    <td>${item.vqitem || "-"}</td>
    <td>${item.quantity - item.vqitem || "-"}</td>
    <td>${item.quantity || "-"}</td>
</tr>
    `;

        productList.insertAdjacentHTML("beforeend", row);
    });
};

// Εμφάνιση του popup window
function showPopup(popupId) {
    document.getElementById(popupId).style.display = "block";
}

// Κλείσιμο του popup window
function closePopup(popupId) {
    document.getElementById(popupId).style.display = "none";
}

// Εφαρμογή φίλτρων στα προϊόντα
function applyFilters(category) {
    const products = document.querySelectorAll("#productList tr");

    products.forEach((product) => {
        // Παίρνουμε την κλάση από το <span class="category"> που ορίζει την κατηγορία
        const categoryClass = product.querySelector(".category").classList[2]; // Παίρνουμε τη δεύτερη κλάση (π.χ. 'food')

        if (category === "ALL") {
            // Εάν είναι "Όλα", εμφανίζουμε όλα τα προϊόντα
            product.style.display = "table-row";
        } else {
            // Εάν η κατηγορία του προϊόντος ταιριάζει με το φίλτρο, το εμφανίζουμε
            if (categoryClass === category) {
                product.style.display = "table-row"; // Εμφάνιση προϊόντος
            } else {
                product.style.display = "none"; // Απόκρυψη προϊόντος
            }
        }
    });

    // Κλείνουμε το popup μετά την εφαρμογή των φίλτρων
    closePopup("popupFilter");
}

// Fetch δεδομένα κατά την αρχική φόρτωση
document.addEventListener("DOMContentLoaded", async function () {
    const items = await fetchItemsList();
    renderItems(items);
});
