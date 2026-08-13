(function () {
    const scriptSrc = document.currentScript.src;
    const rootPath = scriptSrc.substring(0, scriptSrc.lastIndexOf('/') + 1);

    const path = window.location.pathname;
    const SUBMIT_URL = "https://docs.google.com/forms/d/e/1FAIpQLSePyFmZLFE-JLAPPpzzbfqEi7tIMhIK_mMEFpfXV8yfVe1FYw/viewform";

    let active = "";
    if (path.includes("/Tutorial/") || path.endsWith("learn.html")) active = "learn";
    else if (path.includes("/Store/") || path.endsWith("store.html")) active = "store";
    else if (path.endsWith("chatbot.html")) active = "chatbot";
    else if (path.endsWith("about.html")) active = "about";
    else if (path.endsWith("tos.html") || path.endsWith("privacy.html")) active = "none";
    else active = "home";

    const items = [
        { key: "home", label: "Home", href: rootPath + "index.html" },
        { key: "learn", label: "Learn", href: rootPath + "learn.html" },
        { key: "store", label: "Store", href: rootPath + "Store/store.html" },
        { key: "chatbot", label: "Chatbot", href: rootPath + "chatbot.html" },
        { key: "about", label: "About", href: rootPath + "about.html" }
    ];

    const links = items.map((l) => {
        const cls = l.key === active ? "navbar-link active" : "navbar-link";
        return `                    <li><a href="${l.href}" class="${cls}">${l.label}</a></li>`;
    }).join("\n");

    const searchSvg =
        `                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor"` +
        ` stroke-width="2" stroke-linecap="round" stroke-linejoin="round">\n` +
        `                            <circle cx="11" cy="11" r="8"></circle>\n` +
        `                            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>\n` +
        `                        </svg>`;

    let action;
    if (path.endsWith("learn.html")) {
        action =
            `                    <form class="nav-search-form" id="navSearchForm" onsubmit="event.preventDefault();">\n` +
            `                    ${searchSvg}\n` +
            `                        <input type="text" class="nav-search-input" id="cardSearchInput" placeholder="Search tutorials..." aria-label="Search tutorials">\n` +
            `                    </form>\n\n` +
            `                    <a href="${SUBMIT_URL}" class="submit-btn" target="_blank" rel="noopener">Submit</a>`;
    } else if (path.endsWith("store.html")) {
        action =
            `                    <form class="nav-search-form" id="navSearchForm" onsubmit="event.preventDefault();">\n` +
            `                    ${searchSvg}\n` +
            `                        <input type="text" class="nav-search-input" id="cardSearchInput" placeholder="Search products..." aria-label="Search products">\n` +
            `                    </form>\n\n` +
            `                    <button class="nav-cart-btn" id="openCartBtn" aria-label="View Shopping Cart">\n` +
            `                        <img src="${rootPath}Icon/cart.svg" alt="Cart" class="cart-icon">\n` +
            `                        <span class="cart-badge" id="cartCount">0</span>\n` +
            `                    </button>`;
    } else {
        action =
            `                    <a href="${SUBMIT_URL}" class="submit-btn" target="_blank" rel="noopener">Submit</a>\n` +
            `                    <a href="${rootPath}learn.html" class="navbar-icon" aria-label="Search">\n` +
            `                    ${searchSvg}\n` +
            `                    </a>`;
    }

    const navHTML =
        `<header class="glass-dock">\n` +
        `        <nav>\n` +
        `            <input type="checkbox" id="menu-toggle" class="menu-toggle" hidden>\n\n` +
        `            <div class="navbar-left">\n` +
        `                <label for="menu-toggle" class="menu-btn" aria-label="Toggle Navigation Menu">\n` +
        `                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">\n` +
        `                        <line x1="3" y1="12" x2="21" y2="12"></line>\n` +
        `                        <line x1="3" y1="6" x2="21" y2="6"></line>\n` +
        `                        <line x1="3" y1="18" x2="21" y2="18"></line>\n` +
        `                    </svg>\n` +
        `                </label>\n\n` +
        `                <a href="${rootPath}index.html" class="logo-link">\n` +
        `                    <img src="${rootPath}Logo/logo.png" alt="NextBit Logo" class="navbar-logo">\n` +
        `                </a>\n\n` +
        `                <ul class="navbar-links">\n` +
        links + "\n" +
        `                </ul>\n` +
        `            </div>\n\n` +
        `            <div class="navbar-action">\n` +
        action + "\n" +
        `            </div>\n` +
        `        </nav>\n` +
        `    </header>`;

    const placeholder = document.getElementById('nav-placeholder');
    if (placeholder) placeholder.outerHTML = navHTML;
})();
