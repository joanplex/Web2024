let isEditing = false; // Flag για να ελέγχουμε αν κάνουμε επεξεργασία ή δημιουργία
let currentEditId = null; // Κρατάμε το ID της τρέχουσας ανακοίνωσης που επεξεργαζόμαστε

// Παράδειγμα για να εμφανίζεται το pop-up
function showPopup(popupId) {
    document.getElementById(popupId).style.display = "flex";
}

// Παράδειγμα για να κλείνει το pop-up
function closePopup(popupId) {
    document.getElementById("announcementForm").reset();
    document.getElementById(popupId).style.display = "none";
    isEditing = false; // Απενεργοποιούμε την επεξεργασία όταν κλείνουμε το pop-up
    currentEditId = null; // Επαναφορά του ID
}

// ---------------------------------------------------------------------------------------

const getAnnouncementItem = (announcement) => {
    const announcementsList = document.getElementById("announcementsList");

    const announcementDiv = document.createElement("div");
    announcementDiv.classList.add("announcement");

    // Create items HTML
    const itemsHtml =
        announcement.items && announcement.items.length
            ? `
            <h4>Είδη:</h4>
            <ul class="items-list">
                ${announcement.items
                    .map(
                        (item) => `
                    <li class="item">
                        <span class="item-name">${item.name}</span>
                        <span class="item-quantity">${item.quantity}</span>
                    </li>
                `
                    )
                    .join("")}
            </ul>
        `
            : "<p>...</p>";

    announcementDiv.innerHTML = `
        <h3>${announcement.title}</h3>
        <p>${announcement.description}</p>
        <p><strong>Ημ/νία Δημιουργίας:</strong> ${new Date(
            announcement.created_at
        ).toLocaleDateString()}</p>
        ${itemsHtml}
        <div class="announcement-actions">
            <button onclick="editannouncement(${
                announcement.id
            })">Επεξεργασία</button>
            <button class="delete-button" onclick="deleteannouncement(${
                announcement.id
            })">Διαγραφή</button>
        </div>
    `;

    announcementsList.appendChild(announcementDiv);
};

// Λειτουργία για να κάνει fetch τις ανακοινώσεις από το backend και να τις εμφανίσει
async function fetchannouncements() {
    const res = await fetch("http://localhost:3000/api/announcements");
    if (!res.ok) return;

    const data = await res.json();

    // Εκτύπωση των δεδομένων που επιστρέφει το response
    console.log("Received data:", data);

    const announcementsList = document.getElementById("announcementsList");
    announcementsList.innerHTML = ""; // Καθαρισμός της λίστας

    // Δημιουργία HTML για κάθε ανακοίνωση
    data.forEach(getAnnouncementItem);
}

// ---------------------------------------------------------------------------------------

const newAnnouncement = () => {
    document.getElementById(
        "h3-popup-title"
    ).innerHTML = `Δημιουργία Ανακοίνωσης`;
    showPopup("announcementPopup");
};

// Λειτουργία επεξεργασίας ανακοινώσεων
async function editannouncement(id) {
    isEditing = true;
    currentEditId = id;

    console.log("Editing announcement with ID:", id);

    const res = await fetch(`http://localhost:3000/api/announcements/${id}`);
    if (!res.ok) return;

    const announcement = await res.json();

    const { items } = announcement;
    const item = items && items.length >= 1 ? items[0] : {};

    document.getElementById(
        "h3-popup-title"
    ).innerHTML = `Επεξεργασία Ανακοίνωσης`;
    document.getElementById("popupTitle").value = announcement.title;
    document.getElementById("popupDescription").value =
        announcement.description;

    const selectElement = document.getElementById("form-item");
    selectElement.value = item.id;

    // Create a new option if it doesn't exist
    let option = selectElement.querySelector(`option[value="${item.id}"]`);
    if (!option) {
        option = new Option(item.name, item.id);
        selectElement.add(option);
    }

    // Set the selected option
    selectElement.selectedIndex = Array.from(selectElement.options).findIndex(
        (opt) => opt.value == item.id
    );

    document.getElementById("form-quantity").value = item.quantity;

    showPopup("announcementPopup");
}

// Λειτουργία για να αποθηκεύει νέα ανακοίνωση
async function saveAnnouncement() {
    const title = document.getElementById("popupTitle").value;
    const description = document.getElementById("popupDescription").value;
    // TODO: multiple
    const item_id = document.getElementById("form-item").value;
    const quantity = document.getElementById("form-quantity").value;

    const data = {
        title,
        description,
        items: [
            { item_id, quantity },
            // TODO: support for more...
        ],
    };

    const res = await fetch("http://localhost:3000/api/announcements", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
    });

    if (!res.ok) return;

    fetchannouncements(); // Ενημέρωση της λίστας μετά την αποθήκευση
    closePopup("announcementPopup"); // Κλείσιμο του popup
}

// Ενημέρωση ανακοίνωσης
function updateannouncement(id) {
    const title = document.getElementById("popupTitle").value;
    const description = document.getElementById("popupDescription").value;
    // TODO: multiple
    const item_id = document.getElementById("form-item").value;
    const quantity = document.getElementById("form-quantity").value;

    const data = {
        title,
        description,
        items: [
            { item_id, quantity },
            // TODO: support for more...
        ],
    };

    fetch(`http://localhost:3000/api/announcements/${id}`, {
        method: "PUT",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
    })
        .then((response) => response.json())
        .then((result) => {
            if (result.success) {
                fetchannouncements(); // Ενημέρωση της λίστας
                closePopup("announcementPopup"); // Κλείσιμο του popup
            }
        });
}

// Διαγραφή ανακοίνωσης
async function deleteannouncement(id) {
    console.log("Deleting announcement with ID:", id); // Προσθήκη για debugging

    if (!id) {
        console.error("Announcement ID is undefined.");
        return;
    }

    const res = await fetch(`http://localhost:3000/api/announcements/${id}`, {
        method: "DELETE",
    });

    if (!res.ok) return;

    // Ενημέρωση της λίστας
    fetchannouncements();
    closePopup("announcementPopup");
}

// ---------------------------------------------------------------------------------------

const handleSubmit = function (event) {
    event.preventDefault();

    if (isEditing) {
        updateannouncement(currentEditId);
    } else {
        saveAnnouncement();
    }
};

// Συνδέουμε τη σωστή λειτουργία αποθήκευσης ή ενημέρωσης όταν πατάμε το κουμπί "Αποθήκευση"
const attachHandleSubmit = () => {
    document
        .getElementById("announcementForm")
        .addEventListener("submit", handleSubmit);
};

// ---------------------------------------------------------------------------------------

const addCategoryOption = (c) => {
    const itemSelect = document.getElementById("form-item");
    if (!itemSelect.querySelector(`option[value="${c.id}"]`)) {
        const option = document.createElement("option");
        option.value = c.id;
        option.innerHTML = c.name;
        itemSelect.appendChild(option);
    }
};

const attachOnOpen = () => {
    const itemSelect = document.getElementById("form-item");

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
    fetchannouncements();
    attachOnOpen();
    attachHandleSubmit();
});
