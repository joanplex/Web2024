document.addEventListener("DOMContentLoaded", function () {
    const loginForm = document.getElementById("loginForm");

    loginForm.addEventListener("submit", async function (e) {
        e.preventDefault();

        const username = document.getElementById("username").value;
        const password = document.getElementById("password").value;

        const res = await fetch("http://localhost:3000/login", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ username, password }),
        });

        if (!res.ok) {
            const error = await res.json().message;
            alert("Login failed: " + error);
        }

        const data = await res.json();

        // Εμφάνιση μηνύματος επιβεβαίωσης
        alert("Login successful");

        // Ανακατεύθυνση στη σελίδα που μας επιστρέφει ο server ως αρχική
        window.location.pathname = data.redirectUrl;
    });
});
