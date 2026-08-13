const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');
require('dotenv').config();

const app = express();

// Required behind Nginx reverse proxy so rate-limiter gets real client IPs
app.set('trust proxy', 1);

// SECURITY MIDDLEWARE
app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors());
app.use(express.json({ limit: '2mb' }));

// SERVE FRONTEND HTML/CSS DIRECTLY FROM PARENT FOLDER
app.use(express.static(path.join(__dirname, '..')));

// RATE LIMITER (15 requests per 15 mins per IP)
const chatLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 15,
    message: { reply: "⚠️ Rate limit reached! Please wait a few minutes before sending another prompt." }
});

// PARSE MULTIPLE MODELS FROM .ENV
const AI_MODELS = process.env.AI_MODELS
    ? process.env.AI_MODELS.split(',').map(m => m.trim())
    : [
        "google/gemma-4-31b-it:free",
        "openrouter/free"
    ];

// SECURE CHATBOT ROUTE
app.post('/api/chat', chatLimiter, async (req, res) => {
    try {
        let { userMessage } = req.body;

        if (!userMessage || typeof userMessage !== 'string') {
            return res.status(400).json({ reply: "Please enter a valid text prompt." });
        }

        userMessage = userMessage.slice(0, 400);

// AUTHENTIC GIAN & NEXTBIT DATA CONTEXT
const systemPrompt = `You are NextBit Assistant, the official technical helper for NextBit.

FOUNDER & BACKGROUND:
- NextBit was created and is maintained by Gian Valentino Ampang, a student at SMKN 6 Balikpapan vocational school majoring in IT Networking.
- Gian built NextBit to showcase his technical skills, earn income, and help his classmates with IT/Networking tasks.

NEXTBIT FREELANCE SERVICES & CONTACT:
NextBit provides technical solutions for individuals and small local businesses:
1. Tech Care (IT Support): OS installation, MS Office setup, game installation, troubleshooting, general computer care.
2. Custom Rig (PC Building): Tailored PC builds matching user budget and specs.
3. Creative (Graphic Design): Eye-catching brand visuals and personal project graphics.
4. Digital (Web Development): Simple, functional websites for individuals and small businesses.
- Freelance Contact: Clients can contact NextBit via WhatsApp at +62 0851 2974 1543.

EXACT TUTORIALS ON NEXTBIT & TECHNICAL DETAILS:
1. Installing Claude Code on Linux: Step-by-step setup on Ubuntu using OpenRouter's free model tier. Configure Claude Code to route through OpenRouter by adding environment variables to ~/.bashrc.
2. SSH Server Monitoring: Create a Telegram bot that alerts you whenever someone logs into your SSH server. Includes detailed location data, IP info, and clickable Google Maps links.
3. How to Set Up & Harden a Secure SSH Server: Complete step-by-step guide for setting up OpenSSH server and implementing essential security configurations on Ubuntu (6 steps total).
4. Installing an Operating System: Use Ventoy to create a bootable USB drive and install Windows 11 through a simple, user-friendly workflow.
5. Installing Microsoft Office for Free: Use the official Office Deployment Tool (ODT) with command-line instructions for silent installation.
6. Windows Optimization: Safe, effective steps to debloat Windows using free tools and built-in utilities, including Storage Sense, Ultimate Performance power plan, and GPU settings optimization.

*** STRICT BEHAVIORAL RULES (MUST FOLLOW) ***
1. Answer the user's question directly, naturally, and concisely.
2. DO NOT mention Gian, SMKN 6, or the WhatsApp number UNLESS the user explicitly asks "who made this site?", "who is Gian?", or "how do I contact you?".
3. DO NOT push, list, or advertise NextBit services UNLESS the user specifically asks about hiring, services, or pricing.
4. Do NOT act like a salesperson. Be a helpful, chill technical assistant. 
5. NEVER append contact info or signatures to the end of standard technical/tutorial answers. Keep it strictly relevant to their prompt.

NOT ON THIS SITE / DO NOT MENTION:
- Docker, Bash Scripting, or deep TCP/IP courses do NOT exist on NextBit.
- LeetCode / software interview puzzles (e.g., "Two Sum") are strictly off-topic.`;

        let replyText = null;

        // MULTI-MODEL FALLBACK LOOP
        for (const model of AI_MODELS) {
            try {
                const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
                    method: "POST",
                    headers: {
                        "Authorization": `Bearer ${process.env.AI_API_KEY}`,
                        "Content-Type": "application/json",
                        "HTTP-Referer": process.env.SITE_URL || `http://localhost:${process.env.PORT || 1140}`,
                        "X-Title": "NextBit AI Assistant"
                    },
                    body: JSON.stringify({
                        model: model,
                        messages: [
                            { role: "system", content: systemPrompt },
                            { role: "user", content: userMessage }
                        ],
                        max_tokens: 700,
                        temperature: 0.3
                    })
                });

                const data = await response.json();
                const candidateReply = data.choices?.[0]?.message?.content;

                if (candidateReply && !candidateReply.includes("User Safety:")) {
                    replyText = candidateReply;
                    break;
                }
            } catch (err) {
                console.warn(`Model ${model} failed, trying next fallback...`);
            }
        }

        if (!replyText) {
            replyText = "The AI service is currently busy. Please try asking again in a moment.";
        }

        return res.json({ reply: replyText });

    } catch (error) {
        console.error("Server Error:", error);
        return res.status(500).json({ reply: "Server error occurred while handling request." });
    }
});

// ============================================================
// STORE PRODUCT CATALOG (source of truth for price & metadata)
// ============================================================
const PRODUCT_CATALOG = {
    p1: {
        id: "p1",
        title: "SSH Terminal Hardener v1.0",
        category: "Desktop Apps",
        price: 50000,       // IDR
        formattedPrice: "Rp 50.000",
        available: true
    },
    p2: {
        id: "p2",
        title: "Telegram SSH Alert Bot Script",
        category: "Scripts & Automation",
        price: 25000,
        formattedPrice: "Rp 25.000",
        available: true
    },
    p3: {
        id: "p3",
        title: "MikroTik Router Setup Config Pack",
        category: "Scripts & Automation",
        price: 35000,
        formattedPrice: "Rp 35.000",
        available: true
    }
};

// GET /api/products — returns the full catalog
app.get('/api/products', (req, res) => {
    res.json({ products: Object.values(PRODUCT_CATALOG) });
});

// POST /api/checkout — validates cart & email, returns order confirmation
const checkoutLimiter = rateLimit({
    windowMs: 5 * 60 * 1000,
    max: 10,
    message: { error: "Too many checkout attempts. Please wait a few minutes." }
});

app.post('/api/checkout', checkoutLimiter, (req, res) => {
    try {
        const { email, cart } = req.body;

        // --- Validate email ---
        if (!email || typeof email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            return res.status(400).json({ error: "A valid email address is required." });
        }

        // --- Validate cart ---
        if (!Array.isArray(cart) || cart.length === 0) {
            return res.status(400).json({ error: "Cart is empty." });
        }

        let orderTotal = 0;
        const validatedItems = [];

        for (const item of cart) {
            const catalogProduct = PRODUCT_CATALOG[item.id];
            if (!catalogProduct) {
                return res.status(400).json({ error: `Unknown product ID: ${item.id}` });
            }
            if (!catalogProduct.available) {
                return res.status(400).json({ error: `${catalogProduct.title} is currently unavailable.` });
            }
            const qty = Math.max(1, parseInt(item.qty) || 1);
            const lineTotal = catalogProduct.price * qty;
            orderTotal += lineTotal;

            validatedItems.push({
                id: catalogProduct.id,
                title: catalogProduct.title,
                price: catalogProduct.price,
                qty,
                lineTotal
            });
        }

        // Build a simple order reference
        const orderRef = `NB-${Date.now()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;

        console.log(`[ORDER] ${orderRef} | ${email} | Total: Rp ${orderTotal.toLocaleString('id-ID')} | Items:`, validatedItems);

        // In production, this is where you would:
        //   1. Create a Midtrans transaction token
        //   2. Send a confirmation email
        //   3. Store the order in a database
        // For now we return a confirmation payload the frontend can display.
        return res.json({
            success: true,
            orderRef,
            email,
            items: validatedItems,
            total: orderTotal,
            formattedTotal: `Rp ${orderTotal.toLocaleString('id-ID')}`,
            message: `Order ${orderRef} received! A download link will be sent to ${email} shortly.`
        });

    } catch (error) {
        console.error("Checkout Error:", error);
        return res.status(500).json({ error: "Server error during checkout. Please try again." });
    }
});

const PORT = process.env.PORT || 1140;
app.listen(PORT, () => console.log(`🚀 NextBit Server running at http://localhost:${PORT}`));
