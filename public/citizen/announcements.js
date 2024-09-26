const getAnnouncementById = async (id) => {
    const res = await fetch(`http://localhost:3000/api/announcements/${id}`, {
        headers: {
            "Content-Type": "application/json",
        },
        method: "GET",
    });

    if (!res.ok) return null;

    return await res.json();
};

// -----------------------------------------------------------------------------------

// να εμφανίζεται το pop-up
async function showPopup(announcementId) {
    const { title, items } = (await getAnnouncementById(announcementId)) || {};

    document.getElementById(
        "popup-title"
    ).innerHTML = `Προσφορά για ανακοίνωση "${title}"`;

    // Create items HTML
    const itemsHtml =
        items && items.length
            ? `
                ${items
                    .map(
                        (item) => `
                    <li class="item">
                        <span class="item-name">${item.name}</span>
                        <span class="item-quantity">(${item.quantity})</span>
                    </li>
                `
                    )
                    .join("")}
        `
            : "<p>...</p>";

    document.getElementById("items-list").innerHTML = itemsHtml;

    document.getElementById("offerPopup").style.display = "flex";
}

// Παράδειγμα για να κλείνει το pop-up
function closePopup() {
    document.getElementById("offerForm").reset();
    document.getElementById("offerPopup").style.display = "none";
}

// ------------------------------------------------------------------------------------

const getAnnouncement = (announcement) => {
    const announcementsList = document.getElementById("announcementsList");

    // Δημιουργία HTML για κάθε ανακοίνωση
    const announcementDiv = document.createElement("div");

    announcementDiv.classList.add("announcement");
    announcementDiv.innerHTML = `
                    <h3>${announcement.title}</h3>
                    <p>${announcement.description}</p>
                    <p><strong>Ημερομηνία Δημιουργίας:</strong> ${new Date(
                        announcement.created_at
                    ).toDateString()}</p>
                    <div class="announcement-offer-button-container">
                        <button onclick="showPopup(${
                            announcement.id
                        })">Προσφέρετε</button>
                    </div>
                `;

    announcementsList.appendChild(announcementDiv);
};

// Λειτουργία για να κάνει fetch τις ανακοινώσεις από το backend και να τις εμφανίσει
async function fetchAll() {
    const res = await fetch("http://localhost:3000/api/announcements");
    if (!res.ok) return;

    const data = await res.json();

    const announcementsList = document.getElementById("announcementsList");
    announcementsList.innerHTML = ""; // Καθαρισμός της λίστας

    data.forEach(getAnnouncement);
}

// ------------------------------------------------------------------------------------------

const handleSubmit = async (event) => {
    event.preventDefault();

    const item_id = document.getElementById("offerForm_item").value;
    const quantity = document.getElementById("offerForm_quantity").value;

    const res = await fetch("http://localhost:3000/api/offers", {
        method: "POST",
        body: JSON.stringify({ item_id, quantity }),
        headers: {
            "Content-Type": "application/json",
        },
    });

    if (!res.ok) return;

    fetchAll();

    closePopup();
};

// Συνδέουμε τη φορμα με handler για submit
const attachHandleSubmit = () => {
    document
        .getElementById("offerForm")
        .addEventListener("submit", handleSubmit);
};

// ----------------------------------------------------------------

const addCategoryOption = (c) => {
    const itemSelect = document.getElementById("offerForm_item");
    const option = document.createElement("option");
    option.value = c.id; // Set the option value to category id
    option.innerHTML = c.name;
    itemSelect.appendChild(option);
};

const attachOnOpen = () => {
    const itemSelect = document.getElementById("offerForm_item");

    itemSelect.addEventListener("focus", async (e) => {
        e.preventDefault();

        itemSelect.innerHTML = ""; // clear

        const res = await fetch("http://localhost:3000/api/items");
        if (!res.ok) return;

        const items = (await res.json()) || [];

        items.forEach(addCategoryOption);
    });
};

// ----------------------------------------------------------------

document.addEventListener("DOMContentLoaded", function () {
    fetchAll();

    attachOnOpen();
    attachHandleSubmit();
});
