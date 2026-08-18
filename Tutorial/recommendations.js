const NEXTBIT_GUIDES = [
    {
        key: "ssh",
        href: "../ssh/ssh.html",
        img: "../../Image/ssh.avif",
        categoryKey: "common.cat_devops",
        titleKey: "lrn.card_ssh_title",
        descKey: "lrn.card_ssh_desc",
        date: "2026-07-20",
        dateKey: "common.july2026"
    },
    {
        key: "claude",
        href: "../claude/claude.html",
        img: "../../Image/claude.avif",
        categoryKey: "common.cat_devops",
        titleKey: "lrn.card_claude_title",
        descKey: "lrn.card_claude_desc",
        date: "2026-07-20",
        dateKey: "common.july2026"
    },
    {
        key: "office",
        href: "../office/office.html",
        img: "../../Image/office.avif",
        categoryKey: "common.cat_systems",
        titleKey: "lrn.card_office_title",
        descKey: "lrn.card_office_desc",
        date: "2026-07-20",
        dateKey: "common.july2026"
    },
    {
        key: "os",
        href: "../os/os.html",
        img: "../../Image/os.avif",
        categoryKey: "common.cat_systems",
        titleKey: "lrn.card_os_title",
        descKey: "lrn.card_os_desc",
        date: "2026-07-20",
        dateKey: "common.july2026"
    },
    {
        key: "speed",
        href: "../speed/speed.html",
        img: "../../Image/speed.webp",
        categoryKey: "common.cat_systems",
        titleKey: "lrn.card_speed_title",
        descKey: "lrn.card_speed_desc",
        date: "2026-07-20",
        dateKey: "common.july2026"
    },
    {
        key: "bot",
        href: "../bot/bot.html",
        img: "../../Image/bot.webp",
        categoryKey: "common.cat_devops",
        titleKey: "lrn.card_bot_title",
        descKey: "lrn.card_bot_desc",
        date: "2026-06-28",
        dateKey: "common.june2026"
    },
    {
        key: "dhcp",
        href: "../dhcp-server-mikrotik/dhcp.html",
        img: "../../Image/dhcp.webp",
        categoryKey: "common.cat_networks",
        titleKey: "lrn.card_dhcp_title",
        descKey: "lrn.card_dhcp_desc",
        date: "2026-06-28",
        dateKey: "common.june2026"
    }
];

function i18nVal(key, fallback) {
    return (window.I18N && I18N.t(key) !== key) ? I18N.t(key) : fallback;
}

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
                    <img src="${g.img}" alt="${i18nVal(g.titleKey, g.title)}" class="card-img"
                        onerror="this.src='../../Image/speed.webp'">
                </div>
                <div class="card-content">
                    <div class="card-meta">
                        <span class="card-category">${i18nVal(g.categoryKey, g.category)}</span>
                        <time datetime="${g.date}">${i18nVal(g.dateKey, g.dateLabel)}</time>
                    </div>
                    <h3 class="card-title">${i18nVal(g.titleKey, g.title)}</h3>
                    <p class="card-desc">${i18nVal(g.descKey, g.desc)}</p>
                </div>
            </article>
        </a>
    `).join("");
}

document.addEventListener("DOMContentLoaded", renderRecommendations);

if (window.I18N && I18N.addTranslations) {
    document.addEventListener("DOMContentLoaded", function () {
        I18N.addTranslations({});
    });
}

