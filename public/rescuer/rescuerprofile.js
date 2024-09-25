// Αρχικοποίηση χάρτη με Leaflet
var map = L.map("map").setView([38.246639, 21.734573], 13); // Αρχική τοποθεσία (Πάτρα)

L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
}).addTo(map);

// Προσθήκη marker για την αποθήκη
var warehouseMarker = L.marker([38.246639, 21.734573])
    .addTo(map)
    .bindPopup("Αποθήκη");

// Προσθήκη marker για το όχημα του διασώστη
var vehicleMarker = L.marker([38.246, 21.735], { draggable: true })
    .addTo(map)
    .bindPopup("Όχημα Διασώστη");

// Συντεταγμένες της βάσης
const baseLocation = { lat: 38.246639, lng: 21.734573 };

// Συνάρτηση για υπολογισμό απόστασης μεταξύ οχήματος και βάσης
function getDistanceFromBase(vehicleLat, vehicleLng, baseLat, baseLng) {
    const R = 6371e3; // Ακτίνα της Γης σε μέτρα
    const φ1 = (vehicleLat * Math.PI) / 180;
    const φ2 = (baseLat * Math.PI) / 180;
    const Δφ = ((baseLat - vehicleLat) * Math.PI) / 180;
    const Δλ = ((baseLng - vehicleLng) * Math.PI) / 180;

    const a =
        Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
        Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    const distance = R * c; // Απόσταση σε μέτρα
    return distance;
}

document.addEventListener("DOMContentLoaded", function () {
    const loadWarehouseBtn = document.getElementById("load-warehouse-btn");
    const warehouseItemsDiv = document.getElementById("warehouse-status");
    const warehousePanel = document.querySelector(".warehouse-panel"); // Σωστή επιλογή του warehouse panel

    // Φόρτωση της κατάστασης αποθήκης όταν το όχημα είναι <= 100 μέτρα
    loadWarehouseBtn.addEventListener("click", function () {
        fetch("http://localhost:3000/warehouse-status")
            .then((response) => response.json())
            .then((data) => {
                displayWarehouseItems(data.items); // Εμφάνιση προϊόντων
            })
            .catch((error) =>
                console.error("Σφάλμα κατά την φόρτωση της αποθήκης:", error)
            );
    });

    // Συνάρτηση για εμφάνιση προϊόντων της αποθήκης
    function displayWarehouseItems(items) {
        warehouseItemsDiv.innerHTML = ""; // Καθαρισμός προηγούμενης λίστας

        items.forEach((item) => {
            if (item.vqitem >= 1) {
                // Χρησιμοποιούμε το vqitem για ποσότητα
                const itemRow = document.createElement("div");
                itemRow.className = "item-row";

                // Checkbox για επιλογή προϊόντος
                const checkbox = document.createElement("input");
                checkbox.type = "checkbox";
                checkbox.value = item.id;
                checkbox.setAttribute("data-category-id", item.category_id);

                // Όνομα προϊόντος
                const nameSpan = document.createElement("span");
                nameSpan.textContent = `${item.name} - Διαθέσιμη Ποσότητα: ${item.vqitem}`;

                // Πεδίο για ποσότητα
                const quantityInput = document.createElement("input");
                quantityInput.type = "number";
                quantityInput.min = "1";
                quantityInput.max = item.vqitem;
                quantityInput.value = "1";

                itemRow.appendChild(checkbox);
                itemRow.appendChild(nameSpan);
                itemRow.appendChild(quantityInput);
                warehouseItemsDiv.appendChild(itemRow);
            }
        });

        console.log("Προϊόντα που φορτώθηκαν:", items); // Προσθήκη για debugging
    }

    function loadItemsToVehicle(selectedItems) {
        // Φιλτράρουμε τα προϊόντα με ποσότητα μεγαλύτερη από 0
        const validItems = selectedItems.filter(item => item.quantity > 0);

        if (validItems.length === 0) {
            alert("Δεν υπάρχουν έγκυρα προϊόντα για φόρτωση.");
            return;
        }

        fetch(`http://localhost:3000/vehicle-load/${vehicleId}`)
            .then(response => response.json())
            .then(data => {
                let currentCargo = data.items || []; // Τα τωρινά προϊόντα στο φορτίο

                validItems.forEach(item => {
                    // Έλεγχος αν το προϊόν υπάρχει ήδη στο φορτίο με βάση το item_id
                    let existingItem = currentCargo.find(i => i.item_id === item.id);

                    if (existingItem) {
                        // Αν το προϊόν υπάρχει ήδη, αυξάνουμε την ποσότητα του
                        existingItem.quantity += item.quantity;
                    } else {
                        // Αν δεν υπάρχει, προσθέτουμε νέο προϊόν στο φορτίο
                        currentCargo.push({
                            item_id: item.id,
                            name: item.name,
                            quantity: item.quantity
                        });
                    }
                });

                fetch("http://localhost:3000/load-items", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ items: validItems, vehicleId: vehicleId }), // Στέλνουμε μόνο τα έγκυρα προϊόντα
                })
                    .then((response) => response.json())
                    .then((data) => {
                        if (data.success) {
                            alert("Τα προϊόντα φορτώθηκαν επιτυχώς και η αποθήκη ενημερώθηκε.");
                            loadVehicleCargo(vehicleId); // Επαναφόρτωση του φορτίου
                            updateWarehouseStatus(); // Ενημέρωση της κατάστασης αποθήκης
                        } else {
                            console.error("Σφάλμα:", data.message);
                        }
                    })
                    .catch((error) => console.error("Σφάλμα κατά τη φόρτωση προϊόντων:", error));
            })
            .catch(error => console.error("Σφάλμα κατά την ανάκτηση φορτίου:", error));
    }


// Συνάρτηση για ξεφόρτωμα προϊόντων από το όχημα (μόνο από το φορτίο)
    function unloadItemsFromVehicle(selectedItems) {
        fetch("http://localhost:3000/unload-items", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ items: selectedItems, vehicleId: vehicleId }),
        })
            .then((response) => response.json())
            .then((data) => {
                if (data.success) {
                    alert("Τα προϊόντα ξεφορτώθηκαν επιτυχώς.");
                    loadVehicleCargo(vehicleId); // Επαναφόρτωση του φορτίου
                } else {
                    console.error("Σφάλμα:", data.message);
                }
            })
            .catch((error) => console.error("Σφάλμα κατά την ξεφόρτωση προϊόντων:", error));
    }
    // Συνάρτηση για φόρτωση του φορτίου από τον server
    function loadVehicleCargo(vehicleId) {
        fetch(`http://localhost:3000/vehicle-load/${vehicleId}`)
            .then((response) => response.json())
            .then((data) => {
                if (data.success) {
                    displayVehicleCargo(data.items); // Εμφάνιση του φορτίου
                } else {
                    console.error("Σφάλμα κατά την ανάκτηση του φορτίου:", data.message);
                }
            })
            .catch((error) =>
                console.error("Σφάλμα κατά την ανάκτηση του φορτίου:", error)
            );
    }

    function displayVehicleCargo(items) {
        let cargoList = document.querySelector(".cargo-list");

        if (!cargoList) {
            cargoList = document.createElement("div");
            cargoList.className = "cargo-list";
            document.querySelector(".load-panel").insertBefore(cargoList, document.querySelector(".load-button"));
        }

        cargoList.innerHTML = ""; // Καθαρισμός της προηγούμενης λίστας

        if (items.length === 0) {
            cargoList.innerHTML = "<p>Δεν υπάρχουν προϊόντα στο φορτίο.</p>";
        }  else {
            const itemMap = {}; // Χάρτης για συνένωση προϊόντων με το ίδιο item_id

            // Συνδυάζουμε προϊόντα με το ίδιο item_id
            items.forEach((item) => {
                if (itemMap[item.item_id]) {
                    itemMap[item.item_id].quantity += item.quantity;
                } else {
                    itemMap[item.item_id] = { ...item }; // Αν δεν υπάρχει, το προσθέτουμε
                }
            });

            // Τώρα εμφανίζουμε τα προϊόντα με σωστή συνένωση
            Object.values(itemMap).forEach((item) => {
                if (item.quantity > 0) {
                    const itemRow = document.createElement("div");
                    itemRow.className = "item-row";

                    const nameSpan = document.createElement("span");
                    nameSpan.textContent = `${item.name} - Ποσότητα: ${item.quantity}`;

                    const checkbox = document.createElement("input");
                    checkbox.type = "checkbox";
                    checkbox.value = item.item_id;

                    const quantityInput = document.createElement("input");
                    quantityInput.type = "number";
                    quantityInput.min = "1";
                    quantityInput.max = item.quantity;
                    quantityInput.value = item.quantity;

                    itemRow.appendChild(checkbox);
                    itemRow.appendChild(nameSpan);
                    itemRow.appendChild(quantityInput);
                    cargoList.appendChild(itemRow);
                }
            });
        }
    }
    // Συνάρτηση για συλλογή των επιλεγμένων προϊόντων από την αποθήκη
    function collectSelectedItemsFromWarehouse() {
        const items = [];
        const itemRows = document.querySelectorAll(".warehouse-panel .item-row");

        itemRows.forEach((row) => {
            const checkbox = row.querySelector('input[type="checkbox"]');
            const quantityInput = row.querySelector('input[type="number"]');

            if (
                checkbox.checked &&
                checkbox.value &&  // Βεβαιωνόμαστε ότι το `checkbox.value` είναι το σωστό `item_id`
                quantityInput &&
                parseInt(quantityInput.value, 10) > 0
            ) {
                items.push({
                    id: checkbox.value,  // `item_id` πρέπει να είναι εδώ σωστό
                    name: checkbox.getAttribute("data-item-name"),  // Το όνομα μπορεί να μην είναι σημαντικό για τη βάση δεδομένων
                    quantity: parseInt(quantityInput.value, 10),
                });
            }
        });

        return items;
    }

// Συνάρτηση για συλλογή των επιλεγμένων προϊόντων από το φορτίο
    function collectSelectedItemsFromCargo() {
        const items = [];
        const itemRows = document.querySelectorAll(".cargo-list .item-row");

        itemRows.forEach((row) => {
            const checkbox = row.querySelector('input[type="checkbox"]');
            const quantityInput = row.querySelector('input[type="number"]');

            if (
                checkbox.checked &&
                checkbox.value &&
                quantityInput &&
                parseInt(quantityInput.value, 10) > 0
            ) {
                items.push({
                    id: checkbox.value,
                    quantity: parseInt(quantityInput.value, 10),
                });
            }
        });

        return items;
    }

    // Συνάρτηση για το κουμπί φόρτωσης
    document.querySelector(".load-button").addEventListener("click", function () {
        const selectedItems = collectSelectedItemsFromWarehouse();
        if (selectedItems.length > 0) {
            loadItemsToVehicle(selectedItems);
        } else {
            alert("Επιλέξτε προϊόντα για φόρτωση.");
        }
    });

// Συνάρτηση για το κουμπί ξεφόρτωσης
    document.querySelector(".unload-button").addEventListener("click", function () {
        const selectedItems = collectSelectedItemsFromCargo(); // Προϊόντα από το φορτίο
        if (selectedItems.length > 0) {
            unloadItemsFromVehicle(selectedItems);
        } else {
            alert("Επιλέξτε προϊόντα για ξεφόρτωση.");
        }
    });
// Συνάρτηση για ανανέωση της κατάστασης της αποθήκης
    function updateWarehouseStatus() {
        // Αντί για .warehouse-panel, χρησιμοποιούμε το ID warehouse-status
        const warehouseItemsDiv = document.getElementById("warehouse-status");

        warehouseItemsDiv.innerHTML = ""; // Καθαρισμός προηγούμενης κατάστασης

        // Κάνε fetch για να πάρεις τα προϊόντα από το backend
        fetch("http://localhost:3000/warehouse-status")
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    // Αν δεν υπάρχουν προϊόντα, εμφανίζουμε ένα μήνυμα
                    if (data.items.length === 0) {
                        warehouseItemsDiv.innerHTML = "<p>Δεν υπάρχουν διαθέσιμα προϊόντα.</p>";
                        return;
                    }

                    // Εμφανίζουμε τα προϊόντα
                    data.items.forEach(item => {
                        if (item.vqitem > 0) { // Μόνο προϊόντα με διαθέσιμη ποσότητα
                            const itemRow = document.createElement("div");
                            itemRow.className = "item-row";

                            const nameSpan = document.createElement("span");
                            nameSpan.textContent = `${item.name} - Διαθέσιμη Ποσότητα: ${item.vqitem}`;

                            const checkbox = document.createElement("input");
                            checkbox.type = "checkbox";
                            checkbox.value = item.id;
                            checkbox.setAttribute("data-item-name", item.name);

                            const quantityInput = document.createElement("input");
                            quantityInput.type = "number";
                            quantityInput.min = "1";
                            quantityInput.max = item.vqitem;
                            quantityInput.value = 1;

                            itemRow.appendChild(checkbox);
                            itemRow.appendChild(nameSpan);
                            itemRow.appendChild(quantityInput);
                            warehouseItemsDiv.appendChild(itemRow);
                        }
                    });
                } else {
                    console.error("Σφάλμα κατά την ενημέρωση της κατάστασης αποθήκης:", data.message);
                }
            })
            .catch(error => console.error("Σφάλμα κατά την ανανέωση της αποθήκης:", error));
    }

// Κλήση της συνάρτησης όταν το όχημα βρίσκεται εντός 100 μέτρων από την αποθήκη
    function checkWarehouseStatus(vehicleLat, vehicleLng) {
        const distance = getDistanceFromBase(
            vehicleLat,
            vehicleLng,
            baseLocation.lat,
            baseLocation.lng
        );

        if (distance <= 100) {
            loadWarehouseBtn.disabled = false;
            warehousePanel.style.display = "block";
            loadVehicleCargo(1); // Φόρτωση του φορτίου
            console.log("Το όχημα είναι εντός 100 μέτρων από τη βάση.");
        } else {
            loadWarehouseBtn.disabled = true;
            warehousePanel.style.display = "none";
            console.log("Το όχημα είναι εκτός 100 μέτρων από τη βάση.");
        }
    }

    const vehicleId = 1;
    // Φόρτωση της τελευταίας τοποθεσίας από τον server
    function loadVehicleLocation() {
        fetch(`http://localhost:3000/vehicle-location/${vehicleId}`)
            .then((response) => response.json())
            .then((data) => {
                if (data.success) {
                    const lastPosition = [
                        data.location.location_lat,
                        data.location.location_lng,
                    ];
                    vehicleMarker.setLatLng(lastPosition); // Θέτουμε το marker στη σωστή τοποθεσία
                    map.setView(lastPosition, 13); // Κεντράρουμε τον χάρτη στη νέα τοποθεσία
                } else {
                    console.error(
                        "Σφάλμα κατά την ανάκτηση τοποθεσίας:",
                        data.message
                    );
                }
            })
            .catch((error) =>
                console.error(
                    "Σφάλμα κατά την επικοινωνία με τον server:",
                    error
                )
            );
    }

    // Κλήση της συνάρτησης για φόρτωση της τοποθεσίας όταν φορτώνεται η σελίδα
    loadVehicleLocation();
    vehicleMarker.on("dragend", function (event) {
        const position = vehicleMarker.getLatLng();
        checkWarehouseStatus(position.lat, position.lng);
        console.log("Νέα τοποθεσία που στέλνουμε:", position.lat, position.lng); // Εμφανίζει τα δεδομένα για έλεγχο

        fetch("http://localhost:3000/update-vehicle-location", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                lat: position.lat,
                lng: position.lng,
                vehicleId: vehicleId,
            }),
        })
            .then((response) => response.json())
            .then((data) => {
                console.log("Απάντηση από τον server:", data); // Εμφανίζουμε την απάντηση για έλεγχο
                if (data.success) {
                    alert("Η τοποθεσία ενημερώθηκε επιτυχώς.");
                    // Αφήνουμε το marker στη νέα του θέση μετά την επιτυχή ενημέρωση
                    vehicleMarker.setLatLng([position.lat, position.lng]);
                } else {
                    console.error(
                        "Σφάλμα κατά την ενημέρωση τοποθεσίας:",
                        data.message
                    );
                }
            })
            .catch((error) => {
                console.error("Σφάλμα:", error);
            });
    });
});
// Εναλλαγή μεταξύ Requests και Offers
document
    .getElementById("requestsButton")
    .addEventListener("click", function () {
        document.querySelector(".requests").style.display = "block";
        document.querySelector(".offers").style.display = "none";
    });

document.getElementById("offersButton").addEventListener("click", function () {
    document.querySelector(".requests").style.display = "none";
    document.querySelector(".offers").style.display = "block";
});
function displayRequests(requests) {
    const list = document.getElementById("request-offer-list");
    list.innerHTML = "";
    requests.forEach((request) => {
        const div = document.createElement("div");
        div.className = "request-offer-item";
        div.innerHTML = `
            <p><strong>${request.citizen_name}</strong></p>
            <p>Τηλέφωνο: ${request.citizen_phone}</p>
            <p>Ημερομηνία Αιτήματος: ${request.request_date}</p>
            <p>Προϊόν: ${request.item}</p>
            <p>Κατηγορία: ${request.category}</p>
            <p>Ποσότητα: ${request.quantity}</p>
            <button>Ακύρωση</button>
            <button>Ολοκληρώθηκε</button>
        `;
        list.appendChild(div);
    });
}

function displayOffers(offers) {
    const list = document.getElementById("request-offer-list");
    list.innerHTML = "";
    offers.forEach((offer) => {
        const div = document.createElement("div");
        div.className = "request-offer-item";
        div.innerHTML = `
            <p><strong>${offer.citizen_name}</strong></p>
            <p>Τηλέφωνο: ${offer.citizen_phone}</p>
            <p>Ημερομηνία Προσφοράς: ${offer.offer_date}</p>
            <p>Προϊόν: ${offer.item}</p>
            <p>Κατηγορία: ${offer.category}</p>
            <p>Ποσότητα: ${offer.quantity}</p>
            <button>Ακύρωση</button>
            <button>Ολοκληρώθηκε</button>
        `;
        list.appendChild(div);
    });
}

// Αναφορά στα κουμπιά φίλτρων
const filterButtons = document.querySelectorAll(".filter-btn");

// Προσθήκη event listener σε κάθε κουμπί
filterButtons.forEach((button) => {
    button.addEventListener("click", function () {
        // Αφαίρεση της ενεργής κλάσης από όλα τα κουμπιά
        filterButtons.forEach((btn) => btn.classList.remove("active"));

        // Προσθήκη της ενεργής κλάσης στο τρέχον κουμπί
        this.classList.add("active");

        // Διαχείριση των φίλτρων (εδώ μπορείς να βάλεις όποια λογική θέλεις)
        const filterId = this.id;
        if (filterId === "filter-all") {
            // Εμφάνιση όλων των markers
            showAllMarkers();
        } else if (filterId === "filter-unassigned-requests") {
            // Εμφάνιση των unassigned requests
            filterUnassignedRequests();
        } else if (filterId === "filter-active-vehicles") {
            // Εμφάνιση των ενεργών οχημάτων
            filterActiveVehicles();
        }
        // Μπορείς να προσθέσεις κι άλλες λογικές για τα υπόλοιπα φίλτρα
    });
});

// Παράδειγμα για εμφάνιση όλων των markers
function showAllMarkers() {
    // Εδώ θα γράψεις τον κώδικα για να εμφανίζεις όλους τους markers στον χάρτη
    console.log("Εμφάνιση όλων των markers");
}

function filterUnassignedRequests() {
    // Εδώ θα γράψεις τον κώδικα για το συγκεκριμένο φίλτρο
    console.log("Εμφάνιση των unassigned requests");
}

function filterActiveVehicles() {
    // Εδώ θα γράψεις τον κώδικα για το συγκεκριμένο φίλτρο
    console.log("Εμφάνιση ενεργών οχημάτων");
}
