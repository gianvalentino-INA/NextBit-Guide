document.addEventListener("DOMContentLoaded", () => {
    const elements = document.querySelectorAll(".animate-on-scroll");
    const reveal = (el) => el.classList.add("is-visible");

    if (!("IntersectionObserver" in window)) {
        elements.forEach(reveal);
        return;
    }

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) reveal(entry.target);
        });
    }, { threshold: 0 });

    elements.forEach(el => observer.observe(el));

    setTimeout(() => {
        elements.forEach(el => {
            if (el.classList.contains("is-visible")) return;
            const rect = el.getBoundingClientRect();
            if (rect.top < window.innerHeight && rect.bottom > 0) reveal(el);
        });
    }, 300);
});
