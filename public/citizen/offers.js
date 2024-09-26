// ------------------------------------------------------------------------------------------

const cancelOffer = async (offer_id) => {
    const res = await fetch(
        `http://localhost:3000/api/offers/${offer_id}/cancel`,
        {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
        }
    );

    if (!res.ok) return;

    fetchAll();
};

// ------------------------------------------------------------------------------------------

const getStatusClass = (status) => {
    return `offer-status-${status}`;
};

const getOfferItem = (offer) => {
    const { id, status, created_at, updated_at, item, quantity } = offer || {};

    const offersList = document.getElementById("offersList");

    const div = document.createElement("div");
    div.classList.add("offer");
    div.setAttribute("data-status", status);
    div.innerHTML = `
                <div class="offer-header">
                    <h3 class="offer-date">${new Date(
                        created_at
                    ).toDateString()}</h3>

                    <h4 class="${getStatusClass(status)}">${status}</h4>
                </div>
                <div class="offer-stuff">
                    <h4>${item.name}</h4>
                    <h4>(${item.category})</h4>
                </div>
                <p>Ποσότητα: ${quantity}</p>
            `;

    // Pending
    if (status === "pending") {
        div.innerHTML += `<button onclick="cancelOffer(${id})">Ακύρωση</button>`;
    }

    // Accepted οr Completed!
    if (status === "completed") {
        div.innerHTML += `
            <div class="offer-stuff">
                <h4>Ημ/νία Ολοκλήρωσης: </h4>
                <h6>(${new Date(updated_at).toDateString()})</h6>
            </div>
        `;
    } else if (status === "accepted") {
        div.innerHTML += `
            <div class="offer-stuff">
                <h4>Ημ/νία Αποδοχής: </h4>
                <h6>(${new Date(updated_at).toDateString()})</h6>
            </div>
        `;
    }

    offersList.appendChild(div);
};

async function fetchAll() {
    const res = await fetch("http://localhost:3000/api/offers");
    if (!res.ok) return;

    const data = await res.json();

    console.log("Received data:", data);

    const offersList = document.getElementById("offersList");
    offersList.innerHTML = ""; // Clear the list

    // Create HTML for each request
    data.forEach(getOfferItem);

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

// ------------------------------------------------------------------------

const showPastRequests = () => {
    const requests = document.querySelectorAll(".offer");

    requests.forEach((request) => {
        if (request.getAttribute("data-status") !== "pending") {
            request.style.display = "block";
        } else {
            request.style.display = "none";
        }
    });
};

const showPendingRequests = () => {
    const requests = document.querySelectorAll(".offer");

    requests.forEach((request) => {
        if (request.getAttribute("data-status") === "pending") {
            request.style.display = "block";
        } else {
            request.style.display = "none";
        }
    });
};

const showAllRequests = () => {
    const requests = document.querySelectorAll(".offer");
    requests.forEach((request) => {
        request.style.display = "block";
    });
};

// ------------------------------------------------------------------------

document.addEventListener("DOMContentLoaded", function () {
    fetchAll();

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
