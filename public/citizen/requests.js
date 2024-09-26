// Παράδειγμα για να εμφανίζεται το pop-up
function showPopup(popupId) {
    document.getElementById(popupId).style.display = "flex";
}

// Παράδειγμα για να κλείνει το pop-up
function closePopup(popupId) {
    document.getElementById("requestForm").reset();
    document.getElementById(popupId).style.display = "none";
}

// ------------------------------------------------------------------------------------------

const cancelRequest = async (request_id) => {
    const res = await fetch(
        `http://localhost:3000/api/requests/${request_id}/cancel`,
        {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
        }
    );

    if (!res.ok) return;

    fetchAll();

    closePopup("requestPopup");
};

// ------------------------------------------------------------------------------------------

const getStatusClass = (status) => {
    return `request-status-${status}`;
};

const getRequestItem = (request) => {
    const div = document.createElement("div");
    div.classList.add("request");
    div.setAttribute("data-status", request.status);
    div.innerHTML = `
                <div class="request-header">
                    <h3 class="request-date">${new Date(
                        request.created_at
                    ).toDateString()}</h3>

                    <h4 class="${getStatusClass(request.status)}">${
        request.status
    }</h4>
                </div>
                <div class="request-stuff">
                    <h4>${request.item.name}</h4>
                    <h4>(${request.item.category})</h4>
                </div>
                <p>Ποσότητα: ${request.quantity}</p>
            `;

    // Pending
    if (request.status === "pending") {
        div.innerHTML += `<button onclick="cancelRequest(${request.id})">Ακύρωση</button>`;
    }

    // Accepted οr Completed!
    if (request.status === "completed") {
        div.innerHTML += `
            <div class="request-stuff">
                <h4>Ημ/νία Ολοκλήρωσης: </h4>
                <h6>(${new Date(request.updated_at).toDateString()})</h6>
            </div>
        `;
    } else if (request.status === "accepted") {
        div.innerHTML += `
            <div class="request-stuff">
                <h4>Ημ/νία Αποδοχής: </h4>
                <h6>(${new Date(request.updated_at).toDateString()})</h6>
            </div>
        `;
    }

    requestsList.appendChild(div);
};

async function fetchAll() {
    const res = await fetch("http://localhost:3000/api/requests");
    if (!res.ok) return;

    const data = await res.json();

    console.log("Received data:", data);

    const requestsList = document.getElementById("requestsList");
    requestsList.innerHTML = ""; // Clear the list

    // Create HTML for each request
    data.forEach(getRequestItem);

    const activeTab = document.querySelector(".tab-button.active");

    if (activeTab) {
        const tabType = activeTab.getAttribute("data-tab");
        applyFilter(tabType);
    } else {
        showAllRequests();
    }
}

function applyFilter(tabType) {
    switch (tabType) {
        case "all":
            showAllRequests();
            break;
        case "current":
            showPendingRequests();
            break;
        case "past":
            showPastRequests();
            break;
    }
}

// ------------------------------------------------------------------------------------------

const handleSubmit = async (event) => {
    event.preventDefault();

    const item_id = document.getElementById("requestForm_item").value;
    const quantity = document.getElementById("requestForm_quantity").value;

    const res = await fetch("http://localhost:3000/api/requests", {
        method: "POST",
        body: JSON.stringify({ item_id, quantity }),
        headers: {
            "Content-Type": "application/json",
        },
    });

    if (!res.ok) return;

    fetchAll();

    closePopup("requestPopup");
};

// Συνδέουμε τη φορμα με handler για submit
const attachHandleSubmit = () => {
    document
        .getElementById("requestForm")
        .addEventListener("submit", handleSubmit);
};

// ------------------------------------------------------------------------

const addCategoryOption = (c) => {
    const itemSelect = document.getElementById("requestForm_item");
    const option = document.createElement("option");
    option.value = c.id; // Set the option value to category id
    option.innerHTML = c.name;
    itemSelect.appendChild(option);
};

const attachOnOpen = () => {
    const itemSelect = document.getElementById("requestForm_item");

    itemSelect.addEventListener("focus", async (e) => {
        e.preventDefault();

        itemSelect.innerHTML = ""; // clear

        const res = await fetch("http://localhost:3000/api/items");
        if (!res.ok) return;

        const items = (await res.json()) || [];

        items.forEach(addCategoryOption);
    });
};

// ------------------------------------------------------------------------

const showPastRequests = () => {
    const requests = document.querySelectorAll(".request");

    requests.forEach((request) => {
        if (request.getAttribute("data-status") !== "pending") {
            request.style.display = "block";
        } else {
            request.style.display = "none";
        }
    });
};

const showPendingRequests = () => {
    const requests = document.querySelectorAll(".request");

    requests.forEach((request) => {
        if (request.getAttribute("data-status") === "pending") {
            request.style.display = "block";
        } else {
            request.style.display = "none";
        }
    });
};

const showAllRequests = () => {
    const requests = document.querySelectorAll(".request");
    requests.forEach((request) => {
        request.style.display = "block";
    });
};

// ------------------------------------------------------------------------

document.addEventListener("DOMContentLoaded", function () {
    fetchAll();
    attachOnOpen();
    attachHandleSubmit();

    // Add event listeners for tab buttons
    const allTab = document.querySelector('.tab-button[data-tab="all"]');
    const currentTab = document.querySelector(
        '.tab-button[data-tab="current"]'
    );
    const pastTab = document.querySelector('.tab-button[data-tab="past"]');

    function setActiveTab(tab) {
        [allTab, currentTab, pastTab].forEach((t) =>
            t.classList.remove("active")
        );
        tab.classList.add("active");
        applyFilter(tab.getAttribute("data-tab"));
    }

    allTab.addEventListener("click", () => setActiveTab(allTab));
    currentTab.addEventListener("click", () => setActiveTab(currentTab));
    pastTab.addEventListener("click", () => setActiveTab(pastTab));

    // Set 'all' tab as default active tab
    setActiveTab(allTab);
});
