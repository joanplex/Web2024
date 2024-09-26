// Function to show the popup form for creating/editing rescuers
function showPopup(popupId) {
    document.getElementById(popupId).style.display = "flex";
}

// Function to close the popup form
function closePopup(popupId) {
    resetPopup();
    document.getElementById(popupId).style.display = "none";
}

// Function to reset the form fields
function resetPopup() {
    document.getElementById("firstName").value = "";
    document.getElementById("lastName").value = "";
    document.getElementById("email").value = "";
    document.getElementById("password").value = "";
}

// Event listener for form submission (create rescuer)
document
    .getElementById("addRescuerForm")
    .addEventListener("submit", async function (event) {
        event.preventDefault(); // Prevent the form from redirecting

        const firstName = document.getElementById("firstName").value;
        const lastName = document.getElementById("lastName").value;
        const email = document.getElementById("email").value;
        const password = document.getElementById("password").value;

        await createRescuer(firstName, lastName, email, password);

        closePopup("popupRescuer"); // Close the popup after submitting
    });

// Function to create a new rescuer (send data to the server)
const createRescuer = async (firstName, lastName, email, password) =>
    fetch("http://localhost:3000/api/rescuers", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({ firstName, lastName, email, password }),
    })
        .then((response) => response.json())
        .then((data) => {
            console.log("Rescuer added:", data);

            // After adding the rescuer to the database, display it in the list
            addRescuerToDOM(data);
        })
        .catch((error) => console.error("Error:", error));

// Function to add the newly created rescuer to the DOM
function addRescuerToDOM(rescuer) {
    const { id, firstName, lastName, username } = rescuer;

    const rescuerList = document.getElementById("rescuersList");

    const newRescuer = document.createElement("div");
    newRescuer.classList.add("rescuer");
    newRescuer.setAttribute("data-id", id);
    newRescuer.innerHTML = `
        <h3>${firstName} ${lastName}</h3>
        <p>${username}</p>
        <p><strong>Ενεργά Αιτήματα:</strong> TODO!</p>
    `;

    rescuerList.appendChild(newRescuer); // Add the new rescuer to the list
}

const fetchRescuers = () => fetch("http://localhost:3000/api/rescuers");

// Fetch δεδομένα κατά την αρχική φόρτωση
document.addEventListener("DOMContentLoaded", async function () {
    const res = await fetchRescuers();
    if (!res.ok) return;

    const rescuers = await res.json();

    rescuers.forEach(addRescuerToDOM);
});
