const attachHandlePHPSubmit = () => {
    document
        .getElementById("storehouseForm")
        .addEventListener("submit", function (event) {
            event.preventDefault();

            const phpUrl = document.getElementById("phpUrl").value;

            if (!phpUrl) {
                alert("Παρακαλώ εισάγετε ένα έγκυρο URL.");
                return;
            }

            // Αποστολή του URL στον server
            fetch("http://localhost:3000/api/import-data", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    url: phpUrl, // Χρησιμοποιούμε το url ως κλειδί
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
                    console.log("Απάντηση:", data);
                    alert(data.message || "Επιτυχής εισαγωγή δεδομένων.");
                })
                .catch((error) => {
                    console.error("Σφάλμα κατά την εισαγωγή δεδομένων:", error);
                });
        });
};

document.addEventListener("DOMContentLoaded", function () {
    attachHandlePHPSubmit();
});
