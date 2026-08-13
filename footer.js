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
            <img src="${rootPath}Logo/logo.png" alt="NextBit Logo">
            <p class="foot-tagline">Free, community-made skills to learn and how-to guides for everything.</p>
        </div>
        <div class="foot-columns">
            <div class="foot-col">
                <h4>Explore</h4>
                <ul>
                    <li><a href="${rootPath}learn.html">Learn</a></li>
                    <li><a href="${rootPath}chatbot.html">Chatbot</a></li>
                    <li><a href="https://trakteer.id/NextBit" target="_blank" rel="noopener">Donate</a></li>
                    <li><a href="https://docs.google.com/forms/d/e/1FAIpQLSePyFmZLFE-JLAPPpzzbfqEi7tIMhIK_mMEFpfXV8yfVe1FYw/viewform"
                            target="_blank" rel="noopener">Submit a tutorial</a></li>
                </ul>
            </div>
            <div class="foot-col">
                <h4>Info</h4>
                <ul>
                    <li><a href="${rootPath}about.html">About</a></li>
                    <li><a href="mailto:contact@nextbit.org">Contact</a></li>
                </ul>
            </div>
            <div class="foot-col">
                <h4>Follow</h4>
                <ul>
                    <li><a href="https://www.instagram.com/nextbit.bpp?utm_source=qr&igsh=MWIwdHZra21zcWJocA=="
                            target="_blank" rel="noopener">Instagram</a></li>
                    <li><a href="https://github.com/gianvalentino-INA" target="_blank" rel="noopener">GitHub</a>
                    </li>
                </ul>
            </div>
            <div class="foot-col">
                <h4>Legal</h4>
                <ul>
                    <li><a href="${rootPath}Legal/tos.html">Terms of Service</a></li>
                    <li><a href="${rootPath}Legal/privacy.html">Privacy Policy</a></li>
                </ul>
            </div>
        </div>
    </div>
    <hr class="footer-divider">
    <p class="footer-copyright">&copy; 2026 NextBit. All rights reserved.</p>
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
