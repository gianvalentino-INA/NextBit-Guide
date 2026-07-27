const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');
require('dotenv').config();

const app = express();

// SECURITY MIDDLEWARE
app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors());
app.use(express.json({ limit: '10kb' }));

// SERVE FRONTEND HTML/CSS DIRECTLY
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
        "nvidia/nemotron-3-ultra-550b-a55b:free",
        "nvidia/nemotron-3-super-120b-a12b:free",
        "nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free"
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
- Gian built NextBit to showcase his technical skills, earn income, and help his classmates with IT/Networking tasks like Cisco Packet Tracer labs, VMware setup, and Linux concepts.

NEXTBIT FREELANCE SERVICES & CONTACT:
NextBit provides technical solutions for individuals and small local businesses:
1. Tech Care (IT Support): OS installation, MS Office setup, game installation, troubleshooting, general computer care.
2. Custom Rig (PC Building): Tailored PC builds matching user budget and specs.
3. Creative (Graphic Design): Eye-catching brand visuals and personal project graphics.
4. Digital (Web Development): Simple, functional websites for individuals and small businesses.
- Freelance Contact: Clients can contact NextBit via WhatsApp at +62 0851 2974 1543.

EXACT 6 TUTORIALS ON NEXTBIT & TECHNICAL DETAILS:
1. SSH Setup on Linux: Ubuntu terminal workflow using "sudo apt update", "sudo apt install openssh-server", and editing config via "nano /etc/ssh/sshd_config".
2. Installing Claude Code on Linux: Step-by-step setup tailored for Ubuntu distro systems using terminal and Node dependencies.
3. Installing Microsoft Office for Free: Uses the official Office Deployment Tool (ODT), Office Customization Tool, and CMD configuration.
4. Installing an Operating System: Practical guide using a USB flash disk prepared with Ventoy for effortless OS installations.
5. How to Connect Two Virtual Machines: Connects two VMs over an isolated network (Host-Only/Internal) so they interact without internet access.
6. Dual Booting Windows & Linux Safely: Highlights disabling Windows Fast Startup before shrinking partitions to prevent boot corruption.

NOT ON THIS SITE / DO NOT MENTION:
- Docker, Bash Scripting, or deep TCP/IP courses do NOT exist on NextBit.
- LeetCode / software interview puzzles (e.g., "Two Sum") are strictly off-topic.

STRICT RESPONSE RULES:
1. Natural & Direct Tone: Keep responses grounded, concise, direct, and practical. Avoid overly dramatic, fake, or robotic AI enthusiasm.
2. Creator & Contact Credit: Always credit Gian Valentino Ampang (student at SMKN 6 Balikpapan) when asked who built the site, and share WhatsApp (+62 0851 2974 1543) for service inquiries.
3. Short Overview Teasers: Provide brief 2-sentence summaries using Gian's specific methods (e.g., Ventoy, ODT, isolated network, Fast Startup). ALWAYS instruct users to check the "Learn" tab on NextBit for the full tutorial steps.
4. Scope: Keep answers strictly focused on NextBit, Gian's services, and the 6 tutorials above. Decline unrelated off-topic prompts politely.`;

        let replyText = null;

        // MULTI-MODEL FALLBACK LOOP
        for (const model of AI_MODELS) {
            try {
                const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
                    method: "POST",
                    headers: {
                        "Authorization": `Bearer ${process.env.AI_API_KEY}`,
                        "Content-Type": "application/json",
                        "HTTP-Referer": `http://localhost:${process.env.PORT || 1140}`,
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
app.listen(PORT, () => console.log(`🚀 NextBit Server running at http://localhost:${PORT}/chatbot.html`));