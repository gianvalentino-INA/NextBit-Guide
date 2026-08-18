(function() {
    // 1. Get the root path of the script location
    const scriptSrc = document.currentScript.src;
    const rootPath = scriptSrc.substring(0, scriptSrc.lastIndexOf('/') + 1);

    // 2. Load footer CSS dynamically
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = rootPath + 'footer.css';
    document.head.appendChild(link);

    // 3. Define the footer HTML content using rootPath for links and assets
    const htmlContent = `
<footer>
    <div class="footer-top">
        <div class="foot-logo">
            <img src="${rootPath}Logo/logo.png" alt="NextBit Logo" data-i18n-alt="footer.logo_alt">
            <p class="foot-tagline" data-i18n="footer.tagline">Free, community-made skills to learn and how-to guides for everything.</p>
        </div>
        <div class="foot-columns">
            <div class="foot-col">
                <h4 data-i18n="footer.explore">Explore</h4>
                <ul>
                    <li><a href="${rootPath}learn.html" data-i18n="nav.learn">Learn</a></li>
                    <li><a href="${rootPath}chatbot.html" data-i18n="nav.chatbot">Chatbot</a></li>
                    <li><a href="https://trakteer.id/NextBit" target="_blank" rel="noopener" data-i18n="footer.donate">Donate</a></li>
                    <li><a href="https://docs.google.com/forms/d/e/1FAIpQLSePyFmZLFE-JLAPPpzzbfqEi7tIMhIK_mMEFpfXV8yfVe1FYw/viewform"
                            target="_blank" rel="noopener" data-i18n="footer.submit_tutorial">Submit a tutorial</a></li>
                </ul>
            </div>
            <div class="foot-col">
                <h4 data-i18n="footer.info">Info</h4>
                <ul>
                    <li><a href="${rootPath}about.html" data-i18n="nav.about">About</a></li>
                    <li><a href="mailto:contact@nextbit.org" data-i18n="footer.contact">Contact</a></li>
                </ul>
            </div>
            <div class="foot-col">
                <h4 data-i18n="footer.follow">Follow</h4>
                <ul>
                    <li><a href="https://www.instagram.com/nextbit.bpp?utm_source=qr&igsh=MWIwdHZra21zcWJocA=="
                            target="_blank" rel="noopener" data-i18n="footer.instagram">Instagram</a></li>
                    <li><a href="https://github.com/gianvalentino-INA" target="_blank" rel="noopener" data-i18n="footer.github">GitHub</a>
                    </li>
                </ul>
            </div>
            <div class="foot-col">
                <h4 data-i18n="footer.legal">Legal</h4>
                <ul>
                    <li><a href="${rootPath}Legal/tos.html" data-i18n="footer.tos">Terms of Service</a></li>
                    <li><a href="${rootPath}Legal/privacy.html" data-i18n="footer.privacy">Privacy Policy</a></li>
                </ul>
            </div>
        </div>
    </div>
    <hr class="footer-divider">
    <p class="footer-copyright">&copy; 2026 NextBit. <span data-i18n="footer.copyright">All rights reserved.</span></p>
</footer>
    `;

    // 4. Inject the footer HTML into the placeholder element
    let placeholder = document.getElementById('footer-placeholder');
    if (!placeholder) {
        placeholder = document.querySelector('footer');
    }

    if (placeholder) {
        placeholder.outerHTML = htmlContent;
    }
})();
