const express = require("express");
const axios = require("axios");
const cors = require("cors");
const bodyParser = require("body-parser");
const crypto = require("crypto");
const cacheHelper = require("./helpers/cacheHelper");

const app = express();
const API_KEY = "1e9be4c77b8d80c5b2d4936e5cffa7350887790c";

app.use(cors());

// Middleware to parse raw body
app.use(bodyParser.text({ type: "*/*" }));

// Middleware for logging incoming requests
app.use((req, res, next) => {
    console.log("Incoming request:", req.method, req.url, new Date());
    next();
});

// Signature Verification Middleware
const verifySignature = (req, res, next) => {
    try {
        const signature = req.headers["x-sg-signature"];
        if (!signature) {
            console.error("❌ Signature not found!");
            return res.status(400).json({ error: "Signature not found!" });
        }

        const rawBody = req.body; // Capture raw body

        // Generate hash using HMAC SHA256
        const hash = crypto.createHmac("sha256", API_KEY)
            .update(rawBody)
            .digest("base64");

        console.log({ expectedHash: hash, receivedSignature: signature });

        if (hash !== signature) {
            console.error("❌ Signature mismatch!");
            return res.status(400).json({ error: "Signature doesn't match!" });
        }

        console.log("✅ Signature verified successfully.");
        next(); // Move to the next middleware if verification is successful
    } catch (error) {
        console.error("❌ Error verifying signature:", error.message);
        return res.status(500).json({ error: "Internal Server Error" });
    }
};

// Webhook Endpoint (Protected by Signature Verification)
app.post("/webhook", verifySignature, (req, res) => {
    try {
        const parsedData = JSON.parse(req.body); // Parse raw JSON string

        if (parsedData.messages) {
            const messages = parsedData.messages;
            messages.forEach((message) => {
                console.log("📩 Received Message:", message);

                if (message.message.toLowerCase() === "hi") {
                    console.log("🤖 Replying to:", message.number);
                    // Implement reply logic here
                }
            });

            // Store request in cache
            cacheHelper.addRequest({
                timestamp: new Date(),
                data: parsedData,
            });

            return res.status(200).json({ message: "Webhook received successfully!" });
        } else if (parsedData.ussdRequest) {
            const { deviceID, simSlot, request, response } = parsedData.ussdRequest;
            console.log(`📡 USSD Request from device ${deviceID}, SIM Slot: ${simSlot}`);
            console.log(`📝 Request: ${request}, Response: ${response}`);

            return res.status(200).json({ message: "USSD request processed!" });
        }
    } catch (error) {
        console.error("❌ Error processing webhook:", error.message);
        return res.status(400).json({ error: "Bad Request!" });
    }
});

// Endpoint to Fetch Webhook Requests from Cache
app.get("/fetch-webhook-requests", (req, res) => {
    const { mobileNumber, count } = req.query;
    const limit = count ? parseInt(count, 10) : undefined;

    const requests = cacheHelper.getRequests({ mobileNumber, count: limit });

    res.json(requests);
});

// Endpoint to Flush Cache
app.delete("/flush-cache", (req, res) => {
    cacheHelper.flushCache();
    res.json({ message: "🧹 Cache flushed successfully!" });
});

// Start Server
app.listen(5000, "0.0.0.0", () => {
    console.log(`🚀 Backend running at http://172.16.0.204:5000`);
});
