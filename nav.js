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
        { key: "home", label: "nav.home", href: rootPath + "index.html" },
        { key: "learn", label: "nav.learn", href: rootPath + "learn.html" },
        { key: "store", label: "nav.store", href: rootPath + "Store/store.html" },
        { key: "chatbot", label: "nav.chatbot", href: rootPath + "chatbot.html" },
        { key: "about", label: "nav.about", href: rootPath + "about.html" }
    ];

    const links = items.map((l) => {
        const cls = l.key === active ? "navbar-link active" : "navbar-link";
        return `                    <li><a href="${l.href}" class="${cls}" data-i18n="${l.label}">${l.label}</a></li>`;
    }).join("\n");

    const searchSvg =
        `                        <svg class="nav-search-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor"` +
        ` stroke-width="2" stroke-linecap="round" stroke-linejoin="round">\n` +
        `                            <circle cx="11" cy="11" r="8"></circle>\n` +
        `                            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>\n` +
        `                        </svg>`;

    let action;
    if (path.endsWith("learn.html")) {
        action =
            `                    <form class="nav-search-form" id="navSearchForm" onsubmit="event.preventDefault();">\n` +
            `                    ${searchSvg}\n` +
            `                        <input type="text" class="nav-search-input" id="cardSearchInput" data-i18n-ph="nav.search_tutorials" data-i18n-aria="nav.search_tutorials" aria-label="Search tutorials">\n` +
            `                    </form>\n\n` +
            `                    <a href="${SUBMIT_URL}" class="submit-btn" target="_blank" rel="noopener" data-i18n="nav.submit">${window.I18N ? window.I18N.t('nav.submit') : 'Submit'}</a>`;
    } else if (path.endsWith("store.html")) {
        action =
            `                    <form class="nav-search-form" id="navSearchForm" onsubmit="event.preventDefault();">\n` +
            `                    ${searchSvg}\n` +
            `                        <input type="text" class="nav-search-input" id="cardSearchInput" data-i18n-ph="nav.search_products" data-i18n-aria="nav.search_products" aria-label="Search products">\n` +
            `                    </form>\n\n` +
            `                    <button class="nav-cart-btn" id="openCartBtn" data-i18n-aria="nav.cart_aria" aria-label="View Shopping Cart">\n` +
            `                        <img src="${rootPath}Icon/cart.svg" alt="Cart" class="cart-icon">\n` +
            `                        <span class="cart-badge" id="cartCount">0</span>\n` +
            `                    </button>`;
    } else {
        action =
            `                    <a href="${SUBMIT_URL}" class="submit-btn" target="_blank" rel="noopener" data-i18n="nav.submit">${window.I18N ? window.I18N.t('nav.submit') : 'Submit'}</a>\n` +
            `                    <a href="${rootPath}learn.html" class="navbar-icon" data-i18n-aria="nav.search_aria" aria-label="Search">\n` +
            `                    ${searchSvg}\n` +
            `                    </a>`;
    }

    const navHTML =
        `<header class="glass-dock">\n` +
        `        <nav>\n` +
        `            <input type="checkbox" id="menu-toggle" class="menu-toggle" hidden>\n\n` +
        `            <div class="navbar-left">\n` +
        `                <label for="menu-toggle" class="menu-btn" aria-label="Toggle Navigation Menu" data-i18n-aria="nav.menu_aria">\n` +
        `                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">\n` +
        `                        <line x1="3" y1="12" x2="21" y2="12"></line>\n` +
        `                        <line x1="3" y1="6" x2="21" y2="6"></line>\n` +
        `                        <line x1="3" y1="18" x2="21" y2="18"></line>\n` +
        `                    </svg>\n` +
        `                </label>\n\n` +
        `                <a href="${rootPath}index.html" class="logo-link">\n` +
        `                    <img src="${rootPath}Logo/logo.png" alt="NextBit Logo" class="navbar-logo" data-i18n-alt="footer.logo_alt">\n` +
        `                </a>\n\n` +
        `                <ul class="navbar-links">\n` +
        links + "\n" +
        `                </ul>\n` +
        `            </div>\n\n` +
        `            <div class="navbar-action">\n` +
        `                <div class="lang-switch" role="group" data-i18n-aria="nav.lang_aria" aria-label="Language">\n` +
        `                    <button type="button" class="lang-opt" data-lang="id" aria-pressed="false">ID</button>\n` +
        `                    <button type="button" class="lang-opt" data-lang="en" aria-pressed="false">EN</button>\n` +
        `                </div>\n` +
        action + "\n" +
        `            </div>\n` +
        `        </nav>\n` +
        `    </header>`;

    const placeholder = document.getElementById('nav-placeholder');
    if (placeholder) placeholder.outerHTML = navHTML;

    // Language switch click handling
    document.addEventListener('click', (e) => {
        const btn = e.target.closest('.lang-switch .lang-opt');
        if (!btn) return;
        const lang = btn.getAttribute('data-lang');
        if (window.I18N) I18N.setLang(lang);
    });

})();
