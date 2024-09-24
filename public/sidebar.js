document.addEventListener("DOMContentLoaded", function () {
    const sidebarLiCollection = document.getElementsByClassName("sidebar-li");
    if (!sidebarLiCollection) return;

    const elements = Array.from(sidebarLiCollection);

    const paths = window.location.href.split("/");
    const pathname = paths[paths.length - 1]; // last

    elements.forEach((el) => {
        const href = el.getAttribute("onclick").match(/href='([^']+)'/)[1];

        if (pathname === href) {
            el.classList.add("sidebar-active");
        }
    });
});
