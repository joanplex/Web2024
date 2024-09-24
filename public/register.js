document.addEventListener("DOMContentLoaded", function () {
    // Δημιουργία χάρτη
    const map = L.map("map").setView([37.9838, 23.7275], 13); // Default location (Αθήνα)

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "© OpenStreetMap contributors",
    }).addTo(map);

    let latInput = document.getElementById("latitude");
    let lngInput = document.getElementById("longitude");
    let marker;

    // Ενημέρωση συντεταγμένων όταν ο χρήστης κάνει κλικ στον χάρτη
    map.on("click", function (e) {
        latInput.value = e.latlng.lat;
        lngInput.value = e.latlng.lng;

        // Αν υπάρχει ήδη marker, αφαιρούμε τον παλιό
        if (marker) {
            map.removeLayer(marker);
        }

        // Προσθέτουμε νέο marker
        marker = L.marker([e.latlng.lat, e.latlng.lng]).addTo(map);
    });

    const registerForm = document.getElementById("registerForm");

    registerForm.addEventListener("submit", function (e) {
        e.preventDefault();

        const firstName = document.getElementById("firstName").value;
        const lastName = document.getElementById("lastName").value;
        const username = document.getElementById("username").value;
        const password = document.getElementById("password").value;
        const phone = document.getElementById("phone").value;
        const latitude = document.getElementById("latitude").value;
        const longitude = document.getElementById("longitude").value;

        // Έλεγχος αν έχουν οριστεί οι συντεταγμένες
        if (!latitude || !longitude) {
            alert("Παρακαλώ επιλέξτε μία τοποθεσία στον χάρτη.");
            return;
        }

        // Έλεγχος κωδικού πρόσβασης
        if (password.length < 6) {
            alert(
                "Ο κωδικός πρόσβασης πρέπει να περιέχει τουλάχιστον 6 χαρακτήρες."
            );
            return;
        }

        // Έλεγχος τηλεφώνου
        if (phone.length < 10 || isNaN(phone)) {
            alert("Το τηλέφωνο πρέπει να περιέχει τουλάχιστον 10 αριθμούς.");
            return;
        }

        // Δημιουργία του αντικειμένου δεδομένων
        const data = {
            username: username,
            password: password,
            firstName,
            lastName,
            phone: phone,
            latitude: latitude,
            longitude: longitude,
        };

        // Αποστολή δεδομένων στο backend μέσω fetch API
        fetch("http://localhost:3000/register", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(data),
        })
            .then((response) => response.json())
            .then((data) => {
                if (data.success) {
                    alert("Registration successful");
                    window.location.href = "login"; // Ανακατεύθυνση στη σελίδα login
                } else {
                    alert("Registration failed: " + data.message);
                }
            })
            .catch((error) => {
                console.error("Error:", error);
                alert(
                    "Υπήρξε κάποιο πρόβλημα με την εγγραφή. Παρακαλώ δοκιμάστε ξανά."
                );
            });
    });
});
