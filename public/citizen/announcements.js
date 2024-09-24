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

// Λειτουργία για να κάνει fetch τις ανακοινώσεις από το backend και να τις εμφανίσει
function fetchannouncements() {
    fetch("http://localhost:3000/api/announcements") // Χρήση της σωστής θύρας 3000
        .then((response) => {
            console.log("Raw Response:", response); // Εκτύπωση της πρώτης απόκρισης
            if (!response.ok) {
                throw new Error("Network response was not ok");
            }
            return response.json(); // Εδώ χρησιμοποιούμε response.json() για να διαβάσουμε JSON δεδομένα
        })
        .then((data) => {
            console.log("Received data:", data); // Εκτύπωση των δεδομένων που επιστρέφει το response

            const announcementsList =
                document.getElementById("announcementsList");
            announcementsList.innerHTML = ""; // Καθαρισμός της λίστας

            // Δημιουργία HTML για κάθε ανακοίνωση
            data.forEach((announcement) => {
                const announcementDiv = document.createElement("div");
                announcementDiv.classList.add("announcement");
                announcementDiv.innerHTML = `
                    <h3>${announcement.title}</h3>
                    <p>${announcement.description}</p>
                    <p><strong>Ημερομηνία Δημιουργίας:</strong> ${announcement.created_at}</p>
                    <button onclick="editannouncement(${announcement.id})">Δείτε Περισσότερα</button>
                    <button onclick="deleteannouncement(${announcement.id})">Διαγραφή</button>
                `;
                announcementsList.appendChild(announcementDiv);
            });
        })
        .catch((error) => {
            console.error(
                "There was a problem with the fetch operation:",
                error
            );
        });
}

// Λειτουργία επεξεργασίας ανακοινώσεων
function editannouncement(id) {
    isEditing = true;
    currentEditId = id;

    console.log("Editing announcement with ID:", id); // Προσθήκη για debugging

    fetch(`http://localhost:3000/api/announcements/${id}`)
        .then((response) => response.json())
        .then((announcement) => {
            document.getElementById("popupTitle").value = announcement.title;
            document.getElementById("popupDescription").value =
                announcement.description;
            document.getElementById("popupCreatedAt").value =
                announcement.created_at;

            // Ενεργοποίηση του κουμπιού διαγραφής
            document.getElementById("deleteButton").style.display = "block";

            showPopup("announcementPopup");
        })
        .catch((error) => {
            console.error("Error fetching announcement:", error); // Προσθήκη για debugging
        });
}

// Λειτουργία για να αποθηκεύει νέα ανακοίνωση
function saveAnnouncement() {
    const title = document.getElementById("popupTitle").value;
    const description = document.getElementById("popupDescription").value;

    const data = { title, description };

    fetch("http://localhost:3000/api/announcements", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
    })
        .then((response) => response.json())
        .then((result) => {
            if (result.success) {
                fetchannouncements(); // Ενημέρωση της λίστας μετά την αποθήκευση
                closePopup("announcementPopup"); // Κλείσιμο του popup
            }
        })
        .catch((error) => {
            console.error("Error creating announcement:", error);
        });
}

// Ενημέρωση ανακοίνωσης
function updateannouncement(id) {
    const title = document.getElementById("popupTitle").value;
    const description = document.getElementById("popupDescription").value;

    const data = { title, description };

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
function deleteannouncement(id) {
    console.log("Deleting announcement with ID:", id); // Προσθήκη για debugging
    if (!id) {
        console.error("Announcement ID is undefined.");
        return;
    }

    fetch(`http://localhost:3000/api/announcements/${id}`, {
        method: "DELETE",
    })
        .then((response) => {
            if (!response.ok) {
                throw new Error("Error deleting the announcement");
            }
            return response.json();
        })
        .then((result) => {
            if (result.success) {
                fetchannouncements(); // Ενημέρωση της λίστας
                closePopup("announcementPopup");
            }
        })
        .catch((error) => {
            console.error(
                "There was a problem deleting the announcement:",
                error
            );
        });
}

// Συνδέουμε τη σωστή λειτουργία αποθήκευσης ή ενημέρωσης όταν πατάμε το κουμπί "Αποθήκευση"
const attachHandleSubmit = () => {
    document
        .getElementById("announcementForm")
        .addEventListener("submit", function (event) {
            event.preventDefault();

            if (isEditing) {
                updateannouncement(currentEditId);
            } else {
                saveAnnouncement();
            }
        });
};

document.addEventListener("DOMContentLoaded", function () {
    fetchannouncements();
    attachHandleSubmit();
});
