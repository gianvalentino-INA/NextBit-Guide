const NEXTBIT_GUIDES = [
    {
        key: "ssh",
        href: "../ssh/ssh.html",
        img: "../../Image/ssh.avif",
        category: "DevOps",
        title: "How to Set Up & Harden a Secure SSH Server",
        desc: "A step-by-step guide to configuring OpenSSH, key-based authentication, and modern cryptographic rules for server security.",
        date: "2026-07-20",
        dateLabel: "July 2026"
    },
    {
        key: "claude",
        href: "../claude/claude.html",
        img: "../../Image/claude.avif",
        category: "DevOps",
        title: "How to Install & Configure Claude Code CLI on Linux",
        desc: "Learn how to deploy Anthropic's terminal AI agent for terminal automation, code refactoring, and developer productivity.",
        date: "2026-07-20",
        dateLabel: "July 2026"
    },
    {
        key: "office",
        href: "../office/office.html",
        img: "../../Image/office.avif",
        category: "Systems",
        title: "How to Install/Update & Activate Microsoft Office",
        desc: "A step-by-step guide on redeeming your license key and downloading official Office apps directly from your Microsoft account.",
        date: "2026-07-20",
        dateLabel: "July 2026"
    },
    {
        key: "os",
        href: "../os/os.html",
        img: "../../Image/os.avif",
        category: "Systems",
        title: "How to Clean Install Windows or Linux on Any PC",
        desc: "A complete beginner's guide to creating bootable USB installation media, configuring BIOS settings, and partitioning drives safely.",
        date: "2026-07-20",
        dateLabel: "July 2026"
    },
    {
        key: "speed",
        href: "../speed/speed.html",
        img: "../../Image/speed.webp",
        category: "Systems",
        title: "How to Speed Up a Slow PC (Without Buying New Hardware)",
        desc: "Practical system optimizations, startup management, and background service tweaks to restore your computer's speed.",
        date: "2026-07-20",
        dateLabel: "July 2026"
    },
    {
        key: "bot",
        href: "../bot/bot.html",
        img: "../../Image/bot.webp",
        category: "DevOps",
        title: "Automating Real-Time Telegram Alerts for SSH Logins on Linux",
        desc: "Secure your VPS by triggering instant Telegram notifications whenever a user logs into your server via SSH.",
        date: "2026-06-28",
        dateLabel: "June 2026"
    },
    {
        key: "dhcp",
        href: "../dhcp-server-mikrotik/dhcp.html",
        img: "../../Image/dhcp.webp",
        category: "Networks",
        title: "Configuring a Basic DHCP Server on MikroTik RouterOS",
        desc: "Dynamic IP assignment, IP pools, and gateway setup using WinBox.",
        date: "2026-06-28",
        dateLabel: "June 2026"
    }
];

function getCurrentGuideKey() {
    const parts = window.location.pathname.split("/").filter(Boolean);
    const file = parts[parts.length - 1] || "";
    return file.replace(/\.html$/i, "");
}

function shuffle(arr) {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
}

function renderRecommendations() {
    const grid = document.getElementById("recommendationGrid");
    if (!grid) return;

    const current = getCurrentGuideKey();
    const pool = NEXTBIT_GUIDES.filter((g) => g.key !== current);
    const picks = shuffle(pool).slice(0, 3);

    grid.innerHTML = picks.map((g) => `
        <a href="${g.href}" class="card-link">
            <article class="card card--dark-mint">
                <div class="card-img-wrapper">
                    <img src="${g.img}" alt="${g.title}" class="card-img"
                        onerror="this.src='../../Image/speed.webp'">
                </div>
                <div class="card-content">
                    <div class="card-meta">
                        <span class="card-category">${g.category}</span>
                        <time datetime="${g.date}">${g.dateLabel}</time>
                    </div>
                    <h3 class="card-title">${g.title}</h3>
                    <p class="card-desc">${g.desc}</p>
                </div>
            </article>
        </a>
    `).join("");
}

document.addEventListener("DOMContentLoaded", renderRecommendations);
