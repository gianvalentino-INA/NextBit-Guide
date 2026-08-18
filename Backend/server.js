const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');

const { S3Client, GetObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const { Resend } = require('resend');
const midtransClient = require('midtrans-client');

require('dotenv').config();

const app = express();

// ============================================================
// BACKBLAZE B2
// ============================================================

const b2 = new S3Client({
    endpoint: process.env.B2_ENDPOINT,
    region: process.env.B2_REGION || 'us-east-1',
    credentials: {
        accessKeyId: process.env.B2_KEY_ID,
        secretAccessKey: process.env.B2_APPLICATION_KEY
    },
    forcePathStyle: true
});

// ============================================================
// RESEND
// ============================================================

const resend = new Resend(process.env.RESEND_API_KEY);

// ============================================================
// MIDTRANS (SANDBOX IN LOCAL DEVELOPMENT)
// ============================================================

const MIDTRANS_IS_PRODUCTION =
    process.env.MIDTRANS_IS_PRODUCTION === 'true';

const midtransSnap = new midtransClient.Snap({
    isProduction: MIDTRANS_IS_PRODUCTION,
    serverKey: process.env.MIDTRANS_SERVER_KEY,
    clientKey: process.env.MIDTRANS_CLIENT_KEY
});

const midtransCoreApi = new midtransClient.CoreApi({
    isProduction: MIDTRANS_IS_PRODUCTION,
    serverKey: process.env.MIDTRANS_SERVER_KEY,
    clientKey: process.env.MIDTRANS_CLIENT_KEY
});

// Required behind Nginx reverse proxy
app.set('trust proxy', 1);

// SECURITY MIDDLEWARE
app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors());

// PAYLOAD LIMITS
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ limit: '2mb', extended: true }));

// SERVE FRONTEND
app.use(express.static(path.join(__dirname, '..')));

// ============================================================
// AI CHAT
// ============================================================

const chatLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 15,
    message: {
        reply: "⚠️ Rate limit reached! Please wait a few minutes before sending another prompt."
    }
});

app.post('/api/chat', chatLimiter, async (req, res) => {
    try {
        let { userMessage } = req.body;

        if (!userMessage || typeof userMessage !== 'string') {
            return res.status(400).json({
                reply: "Please enter a valid text prompt."
            });
        }

        userMessage = userMessage.slice(0, 400);

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

        try {
            const response = await fetch(
                "https://openrouter.ai/api/v1/chat/completions",
                {
                    method: "POST",
                    headers: {
                        "Authorization": `Bearer ${process.env.AI_API_KEY}`,
                        "Content-Type": "application/json",
                        "HTTP-Referer":
                            process.env.SITE_URL ||
                            `http://localhost:${process.env.PORT || 1140}`,
                        "X-Title": "NextBit AI Assistant"
                    },
                    body: JSON.stringify({
                        model: "openrouter/free",
                        messages: [
                            {
                                role: "system",
                                content: systemPrompt
                            },
                            {
                                role: "user",
                                content: userMessage
                            }
                        ],
                        max_tokens: 700,
                        temperature: 0.3
                    })
                }
            );

            const data = await response.json();

            if (!response.ok) {
                console.error(
                    `[OpenRouter Error] Status ${response.status}:`,
                    data
                );

                replyText =
                    `OpenRouter Error (${response.status}): ` +
                    `${data.error?.message || "API request rejected"}`;
            } else {
                const candidateReply =
                    data.choices?.[0]?.message?.content;

                if (
                    candidateReply &&
                    !candidateReply.includes("User Safety:")
                ) {
                    replyText = candidateReply;
                }
            }
        } catch (err) {
            console.error(
                `OpenRouter fetch failed:`,
                err.message
            );

            replyText =
                `Network error connecting to OpenRouter: ${err.message}`;
        }

        if (!replyText) {
            replyText =
                "The AI service is currently busy. Please try asking again in a moment.";
        }

        return res.json({ reply: replyText });

    } catch (error) {
        console.error("Server Error:", error);

        return res.status(500).json({
            reply: "Server error occurred while handling request."
        });
    }
});

// ============================================================
// STORE PRODUCT CATALOG (SINGLE SOURCE OF TRUTH)
// ============================================================
// NOTE: `b2Key` is BACKEND-ONLY. It is intentionally stripped
// from the products returned by GET /api/products.

const PRODUCT_CATALOG = {
    p1: {
        id: "p1",
        title: "Premium Mockup Collection",
        category: "Template", // must match the category filter tokens used on the Store page
        price: 1000,
        formattedPrice: "Rp 1.000",
        available: true,
        description: "Carefully collected mockups for your design needs.",
        image: "/Image/mockup-thumbnail.png",
        detailPath: "/Store/clothing-packaging-mockups/clothing-packaging.html",
        b2Key: "products/Premium-Mockup-collection.7z"
    }
};

// ============================================================
// ORDER STORE (DEVELOPMENT-ONLY, IN-MEMORY)
// ============================================================
// This is a development convenience store. It is NOT persistent:
// orders are lost when the server restarts. Replace with a real
// database before production deployment.

const orders = new Map();

function toPublicProduct(product) {
    const { b2Key: _b2Key, ...safeProduct } = product;
    return safeProduct;
}

function generateOrderId() {
    return (
        `NB-${Date.now()}-${Math.random()
            .toString(36)
            .slice(2, 6)
            .toUpperCase()}`
    );
}

// ============================================================
// BACKBLAZE B2 SIGNED DOWNLOAD URL (reused from /api/test-b2-download)
// ============================================================

async function generateDownloadUrl(b2Key) {
    const command = new GetObjectCommand({
        Bucket: process.env.B2_BUCKET_NAME,
        Key: b2Key,
        ResponseContentDisposition:
            `attachment; filename="${path.basename(b2Key)}"`
    });

    return getSignedUrl(b2, command, {
        expiresIn: 300
    });
}

// ============================================================
// RESEND INVOICE / DELIVERY EMAIL
// ============================================================

async function sendInvoiceEmail(order, downloadUrl) {
    const emailHtml = `
        <div style="font-family: Arial, Helvetica, sans-serif; max-width: 560px; margin: 0 auto; padding: 32px 24px; color: #0F1B17;">
            <div style="text-align: center; margin-bottom: 24px;">
                <span style="font-size: 28px; font-weight: 800; letter-spacing: 1px;">NEXTBIT</span>
                <p style="margin: 4px 0 0; font-size: 13px; color: #5FDDAC; font-weight: 700;">Payment Receipt</p>
            </div>

            <div style="background: #f7f7f5; border: 1px solid #e5e5e0; border-radius: 12px; padding: 24px;">
                <p style="margin: 0 0 18px; font-size: 15px;">
                    Hi <strong>${order.customer.name}</strong>,
                </p>
                <p style="margin: 0 0 18px; font-size: 14px; line-height: 1.6; color: #3a3f3d;">
                    Thank you for your purchase! Your payment has been confirmed and your
                    product is ready to download.
                </p>

                <table style="width: 100%; font-size: 14px; border-collapse: collapse;">
                    <tr>
                        <td style="padding: 6px 0; color: #6b7270;">Product</td>
                        <td style="padding: 6px 0; text-align: right; font-weight: 600;">${order.productTitle}</td>
                    </tr>
                    <tr>
                        <td style="padding: 6px 0; color: #6b7270;">Order ID</td>
                        <td style="padding: 6px 0; text-align: right; font-weight: 600;">${order.orderId}</td>
                    </tr>
                    <tr>
                        <td style="padding: 6px 0; color: #6b7270;">Amount</td>
                        <td style="padding: 6px 0; text-align: right; font-weight: 700; color: #0F1B17;">${order.formattedPrice}</td>
                    </tr>
                    <tr>
                        <td style="padding: 6px 0; color: #6b7270;">Payment status</td>
                        <td style="padding: 6px 0; text-align: right; font-weight: 700; color: #1f9d5a;">Paid</td>
                    </tr>
                    ${
                        order.paymentType
                            ? `<tr>
                                <td style="padding: 6px 0; color: #6b7270;">Payment method</td>
                                <td style="padding: 6px 0; text-align: right; font-weight: 600;">${order.paymentType}</td>
                            </tr>`
                            : ''
                    }
                </table>

                <div style="text-align: center; margin: 28px 0;">
                    <a href="${downloadUrl}" target="_blank"
                        style="background: #5FDDAC; color: #0F1B17; text-decoration: none; font-weight: 800; font-size: 15px; padding: 14px 32px; border-radius: 10px; display: inline-block;">
                        Download Product
                    </a>
                </div>

                <p style="margin: 0; font-size: 12px; color: #6b7270; text-align: center;">
                    ⏳ This download link is temporary and expires shortly (5 minutes).<br>
                    If the link expires, contact NextBit support to have it regenerated.
                </p>
            </div>

            <p style="text-align: center; font-size: 11px; color: #9aa09e; margin-top: 20px;">
                NextBit &bull; Tools, templates, and server tutorials built for real projects.
            </p>
        </div>
    `;

    const { data, error } = await resend.emails.send({
        from: process.env.RESEND_FROM_EMAIL,
        to: [order.customer.email],
        subject: `Your NextBit download - ${order.productTitle} (${order.orderId})`,
        html: emailHtml
    });

    if (error) {
        throw new Error(`Resend failed: ${error.message || 'unknown error'}`);
    }

    return data.id;
}

// ============================================================
// ORDER FULFILLMENT (IDEMPOTENT)
// ============================================================
// Runs only after Midtrans confirms payment. Generates the
// temporary B2 signed URL and sends the delivery email.

async function fulfillOrder(order) {
    if (order.fulfillmentStatus === 'fulfilled') {
        return false;
    }

    order.paymentStatus = 'paid';
    order.fulfillmentStatus = 'processing';
    order.updatedAt = new Date().toISOString();

    const product = PRODUCT_CATALOG[order.productId];

    if (!product || !product.b2Key) {
        order.fulfillmentStatus = 'fulfillment_error';
        console.error(
            `[FULFILLMENT ERROR] Missing product/b2Key for order ${order.orderId}`
        );
        throw new Error('Missing product configuration for fulfillment');
    }

    const downloadUrl = await generateDownloadUrl(product.b2Key);
    order.downloadUrl = downloadUrl;
    order.fulfillmentStatus = 'url_generated';

    const messageId = await sendInvoiceEmail(order, downloadUrl);

    order.emailMessageId = messageId;
    order.fulfillmentStatus = 'fulfilled';
    order.fulfilledAt = new Date().toISOString();
    order.updatedAt = order.fulfilledAt;

    console.log(
        `[FULFILLED] order=${order.orderId} product=${order.productId} email=${order.customer.email} messageId=${messageId}`
    );

    return true;
}

// ============================================================
// GET PRODUCTS
// ============================================================

app.get('/api/products', (req, res) => {
    res.json({
        products: Object.values(PRODUCT_CATALOG).map(toPublicProduct)
    });
});

// ============================================================
// CHECKOUT — SERVER-SIDE PRICE AUTHORITY
// ============================================================
// The browser only sends { productId, customer }. The price is
// always read from PRODUCT_CATALOG on the server. A frontend can
// never change the charged amount.

const checkoutLimiter = rateLimit({
    windowMs: 5 * 60 * 1000,
    max: 10,
    message: {
        error: "Too many checkout attempts. Please wait a few minutes."
    }
});

app.post('/api/checkout', checkoutLimiter, async (req, res) => {
    try {
        const { productId, customer } = req.body || {};

        if (!productId || typeof productId !== 'string') {
            return res.status(400).json({
                error: "A valid product ID is required."
            });
        }

        const product = PRODUCT_CATALOG[productId];

        if (!product) {
            return res.status(400).json({
                error: `Unknown product ID: ${productId}`
            });
        }

        if (!product.available) {
            return res.status(400).json({
                error: `${product.title} is currently unavailable.`
            });
        }

        const name = String(customer?.name || '').trim();
        const email = String(customer?.email || '').trim();

        if (!name || name.length < 2) {
            return res.status(400).json({
                error: "Please provide your full name."
            });
        }

        if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            return res.status(400).json({
                error: "A valid email address is required."
            });
        }

        const orderId = generateOrderId();

        const order = {
            orderId,
            productId: product.id,
            productTitle: product.title,
            price: product.price,
            formattedPrice: product.formattedPrice,
            customer: { name, email },
            paymentStatus: 'created',
            fulfillmentStatus: 'pending',
            midtransStatus: null,
            midtransTransactionId: null,
            paymentType: null,
            downloadUrl: null,
            emailMessageId: null,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            fulfilledAt: null
        };

        orders.set(orderId, order);

        const transaction = await midtransSnap.createTransaction({
            transaction_details: {
                order_id: orderId,
                gross_amount: product.price
            },
            item_details: [
                {
                    id: product.id,
                    price: product.price,
                    quantity: 1,
                    name: product.title
                }
            ],
            customer_details: {
                first_name: name,
                email
            }
        });

        if (!transaction || !transaction.token) {
            order.paymentStatus = 'midtrans_error';
            order.updatedAt = new Date().toISOString();

            return res.status(502).json({
                error: "Midtrans could not create the transaction. Please try again."
            });
        }

        order.midtransStatus = 'created';
        order.paymentStatus = 'pending';
        order.updatedAt = new Date().toISOString();

        return res.json({
            success: true,
            orderId,
            token: transaction.token,
            redirectUrl: transaction.redirect_url || null,
            midtrans: {
                clientKey: process.env.MIDTRANS_CLIENT_KEY,
                snapScriptUrl: MIDTRANS_IS_PRODUCTION
                    ? 'https://app.midtrans.com/snap/snap.js'
                    : 'https://app.sandbox.midtrans.com/snap/snap.js'
            }
        });

    } catch (error) {
        console.error("Checkout Error:", error.message);

        return res.status(500).json({
            error: "Server error during checkout. Please try again."
        });
    }
});

// ============================================================
// ORDER STATUS (DEV-FRIENDLY, NON-SENSITIVE VIEW)
// ============================================================
// Lets the Store page confirm that a payment became paid/fulfilled.
// Never returns the signed URL, email, or any secret.

app.get('/api/order/:orderId', (req, res) => {
    const order = orders.get(req.params.orderId);

    if (!order) {
        return res.status(404).json({
            error: "Order not found."
        });
    }

    return res.json({
        orderId: order.orderId,
        productTitle: order.productTitle,
        price: order.price,
        formattedPrice: order.formattedPrice,
        paymentStatus: order.paymentStatus,
        fulfillmentStatus: order.fulfillmentStatus,
        midtransStatus: order.midtransStatus,
        midtransTransactionId: order.midtransTransactionId || null,
        paymentType: order.paymentType || null,
        hasDownloadUrl: Boolean(order.downloadUrl),
        createdAt: order.createdAt,
        fulfilledAt: order.fulfilledAt
    });
});

// ============================================================
// MIDTRANS NOTIFICATION WEBHOOK (AUTHORITATIVE PAYMENT CONFIRMATION)
// ============================================================
// Authenticity is verified by calling Midtrans Status API with the
// server key (Midtrans's current recommended mechanism). The stored
// amount is validated. Only after settlement/capture is the order
// fulfilled (B2 signed URL + delivery email).

app.post('/api/midtrans/notification', async (req, res) => {
    let orderId = null;

    try {
        const body = req.body || {};
        orderId = body.order_id;

        if (!orderId || typeof orderId !== 'string' || !orderId.includes('NB-')) {
            return res.status(400).json({
                error: "Missing or invalid order_id."
            });
        }

        const order = orders.get(orderId);

        if (!order) {
            return res.status(404).json({
                error: "Order not found."
            });
        }

        // Prevent duplicate fulfillment.
        if (order.fulfillmentStatus === 'fulfilled') {
            return res.json({
                success: true,
                status: 'already_fulfilled'
            });
        }

        // Verify authenticity by fetching the authoritative status
        // from Midtrans (identified by order_id + server key).
        const status = await midtransCoreApi.transaction.status(orderId);

        const expectedAmount = productAmountToMidtransNumber(order.price);
        const grossAmount = Number(status.gross_amount);
        const statusCode = String(status.status_code || '');

        if (
            Number.isNaN(grossAmount) ||
            grossAmount !== expectedAmount
        ) {
            order.paymentStatus = 'amount_mismatch';
            order.midtransStatus = String(status.transaction_status || statusCode);
            order.updatedAt = new Date().toISOString();

            console.error(
                `[MIDTRANS AMOUNT MISMATCH] order=${orderId} expected=${expectedAmount} got=${status.gross_amount}`
            );

            return res.status(422).json({
                error: "Transaction amount does not match the order."
            });
        }

        const txnStatus = String(status.transaction_status || '');

        order.midtransStatus = txnStatus;
        order.midtransTransactionId = status.transaction_id || null;
        order.paymentType = status.payment_type || null;
        order.updatedAt = new Date().toISOString();

        console.log(
            `[MIDTRANS NOTIFICATION] order=${orderId} status=${txnStatus} txn=${order.midtransTransactionId} amount=${grossAmount}`
        );

        if (txnStatus === 'settlement' || txnStatus === 'capture') {
            await fulfillOrder(order);

            return res.json({
                success: true,
                status: txnStatus
            });
        }

        if (txnStatus === 'pending') {
            order.paymentStatus = 'pending';

            return res.json({
                success: true,
                status: 'pending'
            });
        }

        // deny | cancel | expire | failure -> payment did not complete.
        order.paymentStatus = 'failed';

        return res.json({
            success: true,
            status: txnStatus
        });

    } catch (error) {
        // Distinguish "cannot verify" responses from transient failures.
        // A 4xx from Midtrans (e.g. 404 "Transaction doesn't exist")
        // means the notification cannot be validated -> reply 404 so
        // Midtrans does NOT retry a never-registered/fake transaction.
        // Transient/network failures propagate as 500 so Midtrans retries.
        const status = error && error.httpStatusCode;

        console.error(
            `[MIDTRANS NOTIFICATION ERROR] order=${orderId || '?'} status=${status || 'unknown'}`,
            error.message
        );

        if (status && status >= 400 && status < 500) {
            return res.status(404).json({
                error: "Transaction could not be verified."
            });
        }

        return res.status(500).json({
            error: "Notification handling failed."
        });
    }
});

// Midtrans reports amounts as integers (e.g. 1000 for Rp 1.000).
function productAmountToMidtransNumber(price) {
    return Number(price);
}

// ============================================================
// DEVELOPMENT TEST ENDPOINTS (TOKEN-PROTECTED)
// ============================================================
// Both test endpoints require the B2_TEST_TOKEN via the
// `x-test-token` header so an anonymous internet user cannot
// repeatedly trigger emails or signed URLs.

function requireTestToken(req, res, next) {
    const testToken = req.headers['x-test-token'];

    if (
        !process.env.B2_TEST_TOKEN ||
        testToken !== process.env.B2_TEST_TOKEN
    ) {
        return res.status(401).json({
            error: 'Unauthorized'
        });
    }

    next();
}

app.get(
    '/api/test-b2-download',
    requireTestToken,
    async (req, res) => {
        try {
            const downloadUrl = await generateDownloadUrl(
                'products/Premium-Mockup-collection.7z'
            );

            return res.json({
                success: true,
                expiresIn: 300,
                downloadUrl
            });

        } catch (error) {
            console.error('[B2 TEST ERROR]', error.message);

            return res.status(500).json({
                error: 'Failed to generate B2 download URL.'
            });
        }
    }
);

app.post(
    '/api/test-resend',
    requireTestToken,
    async (req, res) => {
        try {
            const { data, error } = await resend.emails.send({
                from: process.env.RESEND_FROM_EMAIL,
                to: [process.env.TEST_EMAIL],
                subject: 'NextBit Resend Test',
                html: `
                    <h2>Resend is working.</h2>
                    <p>This is a test email from the NextBit backend.</p>
                `
            });

            if (error) {
                console.error('[RESEND ERROR]', error);

                return res.status(500).json({
                    error: 'Resend failed.'
                });
            }

            console.log('[RESEND OK]', data);

            return res.json({
                success: true,
                messageId: data.id
            });

        } catch (error) {
            console.error('[RESEND ERROR]', error);

            return res.status(500).json({
                error: 'Resend request failed.'
            });
        }
    }
);

// ============================================================
// START SERVER
// ============================================================

const PORT = process.env.PORT || 1140;

app.listen(PORT, () =>
    console.log(
        `🚀 NextBit Server running at http://localhost:${PORT}`
    )
);
