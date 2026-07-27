# Project Notes — Repair/Tutorial Platform

Inspired by iFixit (guide layout) + own dashboard (Aplikasi Magang style cards).

---

## 1. Account Login
- Auth methods: email/password minimum. Optional: Google login.
- Fields: name, email, password (hashed), role (`user` / `admin`).
- Pages needed: Login, Register, Forgot Password.
- Session handling: JWT or session cookies — pick one, don't mix.
- Stack ideas: Firebase Auth (fast, less backend work) or custom (Node/Express + bcrypt + JWT) if you want full control.

## 2. AI Chatbot (own API key)
- User pastes their own Anthropic/OpenAI API key → store in browser (localStorage) or account settings — **never send it to your own server unless encrypted**, since it's their personal key.
- Simple chat UI: message list + input box + send button.
- Call the API directly from the client (if key stays client-side) or via a thin backend proxy (if you want to hide network calls / add rate limiting).
- Add a settings modal: "Enter your API key" with a link to where to get one.
- Consider: model picker dropdown, clear chat button, loading state while streaming.

## 3. Dashboard / Home (iFixit-style)
- Hero section: search bar + big call-to-action ("Find a Guide").
- Stat cards row (like your Aplikasi Magang cards): e.g. "X Tutorials", "X Contributors", "X Solutions".
- Featured/recent tutorials grid below (image + tag + title + short description, like the gray "Repair Pulse" cards).
- Sidebar nav (optional) if you want the dashboard-app feel: Home, Tutorials, My Submissions, Chatbot, Donate.

## 4. User-Submitted Tutorials (admin-approved)
- Any logged-in user can submit a tutorial: title, category, steps (rich text or step-by-step blocks), images.
- Submissions go into a `status: pending` state — invisible to public.
- Admin panel: list of pending tutorials → Approve / Reject / Edit.
- Once approved, `status: published` → shows on dashboard/tutorial list.
- Roles check: only `role === 'admin'` can access `/admin` routes (protect both frontend route AND backend endpoint).

## 5. Donation Tab
- Simple page: explain why, add payment option(s).
- For Indonesia: consider Trakteer, Saweria, or Ko-fi/Buy Me a Coffee (int'l) — these need no custom backend, just an embed/link.
- If handling payments yourself: needs a payment gateway (Midtrans/Xendit for ID) — more setup, only worth it if scaling later.

## 6. Footer
- Standard sections: About, Contact, Social links, Copyright.
- Maybe: Language switch + theme switch could live here too (like iFixit's footer globe icon).

## 7. Theme Switch (Light / Dark / System)
- Store preference in `localStorage`.
- Use CSS variables for colors (`--bg`, `--text`, `--card-bg`, etc.) so switching is just toggling a class/attribute on `<html>`.
- "System" option: use `window.matchMedia('(prefers-color-scheme: dark)')` and listen for changes.
- Toggle UI: 3-way switch or dropdown (Light / Dark / System) in navbar.

## 8. Fuzzy Search
- "Not fixed" search = fuzzy search — matches even with typos or partial words (e.g. "labtop fna" still finds "laptop fan").
- Easiest approach: use a client-side library like **Fuse.js** — you give it your tutorial list, it handles fuzzy matching, no backend needed.
- If using a real database later: Postgres has `pg_trgm` (trigram similarity), or use a search service like **Algolia** / **Meilisearch** for a proper fuzzy + typo-tolerant search at scale.
- Search should match against: title, description, tags/category, maybe body content.
- Show live results as they type (debounce input ~300ms so it's not firing on every keystroke).

## 9. Categories
- Since it's mostly you creating them: keep it simple — a fixed list you manage (e.g. `Electronics`, `Networking`, `Software`, `Home Appliances`).
- Each tutorial gets exactly one (or a few) categories assigned at submission/approval time.
- Category page: shows all tutorials in that category, same card layout as the homepage.
- Down the line, if it grows, you could open category *suggestions* to users but keep approval with you.

## 10. Comments + Star Rating
- Comments: logged-in users only, tied to a tutorial (`tutorial_id`, `user_id`, `text`, `created_at`).
- Star rating: 1–5 stars, one rating per user per tutorial (let them update their existing rating, not add duplicates).
- Show average rating + count on the tutorial card and detail page (e.g. ★ 4.6 · 132 ratings).
- Consider: allow comment editing/deleting by the author, and admin can delete abusive comments.

## 11. Profile Page
- Shows: username, avatar, join date, their submitted tutorials (with status: pending/published), their bookmarks, maybe points/badges like your Aplikasi Magang dashboard.
- Editable fields: name, avatar, password change.
- Public view (what others see) vs private view (what the owner sees, e.g. including pending tutorials) — decide if profiles are public at all or just personal.

## 12. Bookmarks
- Simple many-to-many: `user_id` + `tutorial_id` saved list.
- Bookmark button (icon toggle) on tutorial cards and detail pages.
- "My Bookmarks" tab on the profile page.

## 13. SEO
- Clean, readable URLs: `/tutorial/how-to-fix-laptop-fan` instead of `/tutorial?id=482`.
- Unique `<title>` and `<meta description>` per tutorial page (use the tutorial's title/summary).
- Add Open Graph tags (`og:title`, `og:image`, `og:description`) so shared links look good on social/WhatsApp.
- Generate a `sitemap.xml` once you have real content, and a `robots.txt`.
- If using React: server-side rendering or static generation matters a lot for SEO (plain client-side React alone is bad for this) — Next.js handles this well.

## 14. Editing / Update Tutorials
- Owner can edit their own tutorial after submission — but re-editing an *already published* tutorial should probably send it back to `pending` for admin re-review (or at least flag "edited, needs re-check") so people can't sneak in bad edits after approval.
- Keep an `updated_at` timestamp, show "Last updated: [date]" on the tutorial page.
- Optional: version history (store previous versions) — only worth it if you expect frequent major edits; skip for now unless needed.
- Admin should also be able to edit any tutorial directly (typo fixes, formatting cleanup) without needing to go through the original author.

## 15. English / Indonesian Language
- Use an i18n approach: keep text in JSON files (`en.json`, `id.json`) instead of hardcoding strings.
- Simple version (no framework): a `translations` object + a helper function `t('key')` that reads from current language.
- Framework version: `next-intl`, `react-i18next`, or similar if using React/Next.
- Store language choice in `localStorage`, same pattern as theme.
- Don't forget: date formats, and any admin-entered content (tutorials) may only exist in one language unless you build translation fields too.

---

## Suggested Build Order
1. Auth (login/register) — everything else depends on knowing who's logged in.
2. Theme + language toggles — small, isolated, good early wins.
3. Dashboard/home layout — static first, no real data.
4. Categories — decide your fixed list early, since tutorials attach to them.
5. Tutorial submission + admin approval flow (+ editing/update behavior).
6. Tutorial detail page — display layout, once submissions exist.
7. Fuzzy search — once you have real tutorials to search through.
8. Comments + star rating.
9. Bookmarks.
10. Profile page — pulls together submissions, bookmarks, ratings.
11. SEO (clean URLs, meta tags, sitemap) — do this as pages get built, not all at once at the end.
12. Donation tab (mostly static/embed).
13. Footer.
14. AI chatbot — last, since it's the most independent feature.

## Open Questions to Decide Later
- Framework: plain HTML/CSS/JS, or React/Next.js?
- Backend: Firebase (fast) vs custom Node/Express + database (more control)?
- Where are tutorial images stored? (Cloud storage vs local uploads)