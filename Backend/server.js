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
app.use(express.json({ limit: '10kb' }));

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
1. SSH Setup on Linux: Ubuntu terminal workflow using "sudo apt update", "sudo apt install openssh-server", and editing config.
2. Installing Claude Code on Linux: Step-by-step setup tailored for Ubuntu distro systems.
3. Installing Microsoft Office for Free: Uses the official Office Deployment Tool (ODT), Office Customization Tool, and CMD.
4. Installing an Operating System: Practical guide using a USB flash disk prepared with Ventoy for effortless OS installations.

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

const PORT = process.env.PORT || 1140;
app.listen(PORT, () => console.log(`🚀 NextBit Server running at http://localhost:${PORT}`));
