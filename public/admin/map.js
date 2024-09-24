const clearMarkers = () => {};

// Fetch and display requests on the map
function loadRequests() {
    fetch("http://localhost:3000/api/requests")
        .then((response) => response.json())
        .then((requests) => {
            clearMarkers();
            requests.forEach((request) => {
                var marker = L.marker([request.lat, request.lon], {
                    icon: L.icon({
                        iconUrl: "path-to-request-icon.png",
                        iconSize: [25, 25],
                    }),
                }).addTo(map);
                marker.bindPopup(`
                    <b>Request from:</b> ${request.citizen_name}<br>
                    <b>Item:</b> ${request.item_name}<br>
                    <b>Quantity:</b> ${request.quantity}<br>
                    <b>Phone:</b> ${request.citizen_phone}
                `);
            });
        })
        .catch((error) => console.error("Error fetching requests:", error));
}

// Fetch and display offers on the map
function loadOffers() {
    fetch("http://localhost:3000/api/offers")
        .then((response) => response.json())
        .then((offers) => {
            clearMarkers();
            offers.forEach((offer) => {
                var marker = L.marker([offer.lat, offer.lon], {
                    icon: L.icon({
                        iconUrl: "path-to-offer-icon.png",
                        iconSize: [25, 25],
                    }),
                }).addTo(map);
                marker.bindPopup(`
                    <b>Offer from:</b> ${offer.citizen_name}<br>
                    <b>Item:</b> ${offer.item_name}<br>
                    <b>Quantity:</b> ${offer.quantity}<br>
                    <b>Phone:</b> ${offer.citizen_phone}
                `);
            });
        })
        .catch((error) => console.error("Error fetching offers:", error));
}

// Fetch and display vehicles on the map
function loadVehicles() {
    fetch("http://localhost:3000/api/vehicles")
        .then((response) => response.json())
        .then((vehicles) => {
            clearMarkers();
            vehicles.forEach((vehicle) => {
                var marker = L.marker([vehicle.lat, vehicle.lon], {
                    icon: L.icon({
                        iconUrl: "path-to-vehicle-icon.png",
                        iconSize: [25, 25],
                    }),
                }).addTo(map);
                marker.bindPopup(`
                    <b>Vehicle:</b> ${vehicle.name}<br>
                    <b>Status:</b> ${vehicle.status}<br>
                    <b>Load:</b> ${vehicle.load}<br>
                `);
                vehicle.tasks.forEach((task) => {
                    var taskLatLng = L.latLng(task.lat, task.lon);
                    L.polyline([marker.getLatLng(), taskLatLng], {
                        color: "blue",
                    }).addTo(map);
                });
            });
        })
        .catch((error) => console.error("Error fetching vehicles:", error));
}

async function initPage() {
    // Αρχικοποίηση του χάρτη στην Πάτρα
    var map = L.map("map").setView([38.2466, 21.7346], 13);

    // Προσθήκη OpenStreetMap layer
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "Map data © OpenStreetMap contributors",
    }).addTo(map);

    // Προσθήκη βάσης (dummy data για βάση)
    var baseMarker = L.marker([38.24, 21.73], {
        draggable: true,
    }).addTo(map);

    baseMarker.bindPopup("<b>Βάση</b><br>Σύρετε για αλλαγή θέσης βάσης.");

    baseMarker.on("dragend", function (event) {
        var position = event.target.getLatLng();
        var confirmChange = confirm(
            `Επιβεβαίωση νέας τοποθεσίας βάσης: ${position.lat}, ${position.lng}`
        );

        if (confirmChange) {
            alert("Η τοποθεσία της βάσης ενημερώθηκε.");
            // Εδώ μπορεί να προστεθεί η αποστολή δεδομένων στο backend για αποθήκευση της νέας τοποθεσίας
        } else {
            event.target.setLatLng([38.24, 21.73]); // Επαναφορά στην αρχική τοποθεσία
        }
    });

    // Fetch and display vehicles
    loadVehicles();
    loadOffers();
    // loadRequests();
}

// Fetch δεδομένα κατά την αρχική φόρτωση
document.addEventListener("DOMContentLoaded", initPage);

// Εμφάνιση pop-up
function showPopup(popupId) {
    document.getElementById(popupId).style.display = "flex";
}

// Κλείσιμο pop-up
function closePopup(popupId) {
    document.getElementById(popupId).style.display = "none";
}

//
//  Button Group click handlers
//

const handleInactiveVehiclesClick = async () => {
    const res = await fetch("/api/vehicles/inactive");
    const data = await res.json();

    if (!res.ok) {
        console.error("Error fetching inactive vehicles");
        return;
    }

    const vehiclesList = document.getElementById("vehiclesList");
    vehiclesList.innerHTML = ""; // Καθαρισμός της λίστας

    data.forEach((vehicle) => {
        const listItem = document.createElement("li");
        listItem.textContent = `Όχημα: ${vehicle.name}, Φορτίο: ${vehicle.load}, Κατάσταση: ${vehicle.status}`;
        vehiclesList.appendChild(listItem);
    });

    // Εμφάνιση του αντίστοιχου pop-up
    showPopup("popupVehicles");
};

// Φόρτωση αιτημάτων στο pop-up
const handlePendingRequestsClick = async () => {
    const res = await fetch("http://localhost:3000/api/requests");
    const data = await res.json();

    if (!res.ok) {
        console.error("Error fetching pending requests");
        return;
    }

    const requestsList = document.getElementById("requestsList");
    requestsList.innerHTML = ""; // Καθαρισμός της λίστας

    data.forEach((request) => {
        const listItem = document.createElement("li");
        listItem.textContent = `Πολίτης: ${request.name}, Αίτημα: ${request.item}, Ποσότητα: ${request.quantity}`;
        requestsList.appendChild(listItem);
    });
    showPopup("popupRequests");
};

// Φόρτωση προσφορών στο pop-up
const handleOffersClick = async () => {
    const res = await fetch("http://localhost:3000/api/offers");
    const data = await res.json();

    if (!res.ok) {
        console.error("Error fetching offers");
        return;
    }

    const offersList = document.getElementById("offersList");
    offersList.innerHTML = ""; // Καθαρισμός της λίστας

    data.forEach((offer) => {
        const listItem = document.createElement("li");
        listItem.textContent = `Πολίτης: ${offer.name}, Προσφορά: ${offer.item}, Ποσότητα: ${offer.quantity}`;
        offersList.appendChild(listItem);
    });
    showPopup("popupOffers");
};

// Φόρτωση οχημάτων στο pop-up
const handleActiveVehiclesClick = async () => {
    const res = await fetch("http://localhost:3000/api/vehicles/active");
    const data = await res.json();

    if (!res.ok) {
        console.error("Error fetching vehicles");
        return;
    }

    const vehiclesList = document.getElementById("vehiclesList");
    vehiclesList.innerHTML = ""; // Καθαρισμός της λίστας

    data.forEach((vehicle) => {
        const listItem = document.createElement("li");
        listItem.textContent = `Όχημα: ${vehicle.username}, Φορτίο: ${vehicle.load}, Κατάσταση: ${vehicle.status}`;
        vehiclesList.appendChild(listItem);
    });

    showPopup("popupVehicles");
};
