const attachHandleJSONSubmit = () => {
    document
        .getElementById("jsonForm")
        .addEventListener("submit", function (event) {
            event.preventDefault();

            const jsonFileInput = document.getElementById("jsonFile");
            const file = jsonFileInput.files[0];

            if (file && file.type === "application/json") {
                const reader = new FileReader();

                reader.onload = function (e) {
                    const jsonData = JSON.parse(e.target.result);

                    // Αποστολή του JSON στον server
                    fetch("http://localhost:3000/api/import-json", {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                        },
                        body: JSON.stringify(jsonData),
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
                            console.log("Επιτυχής εισαγωγή δεδομένων:", data);
                            alert(data.message);

                            // Ανανεώνουμε τις κατηγορίες και τα είδη μετά την εισαγωγή
                            fetchCategories();
                            fetchItems();
                        })
                        .catch((error) => {
                            console.error(
                                "Σφάλμα κατά την εισαγωγή δεδομένων:",
                                error
                            );
                            alert("Σφάλμα κατά την εισαγωγή του JSON αρχείου.");
                        });
                };

                reader.readAsText(file);
            } else {
                alert("Παρακαλώ ανεβάστε ένα έγκυρο αρχείο JSON.");
            }
        });
};

document.addEventListener("DOMContentLoaded", function () {
    attachHandleJSONSubmit();
});
