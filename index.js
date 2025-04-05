const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const cacheHelper = require("./helpers/cacheHelper");
const verifySignatureMiddleware = require("./middleware/verifysignature"); // Import the middleware

const app = express();

app.use(
    cors({
        origin: "*", // Allow all origins
        methods: "GET,POST,PUT,DELETE",
        allowedHeaders: "Content-Type,Authorization",
    })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Middleware for logging incoming requests
app.use((req, res, next) => {
    console.log("Incoming request:", {
        method: req.method,
        url: req.url,
        headers: req.headers,
        body: req.body,
        timestamp: new Date().toISOString(),
    });
    next();
});

// Webhook Endpoint (Protected by Signature Verification Middleware)
app.post("/webhook", (req, res) => {
    try {
        if (req.body.messages) {
            // Store request in cache
            cacheHelper.addRequest({
                timestamp: new Date(),
                data: req.body,
            });

            return res.status(200).send("Webhook received successfully!");
        } else if (req.body.ussdRequest) {
            // Handle USSD request
            const ussdRequest = req.body.ussdRequest;
            const deviceID = ussdRequest.deviceID;
            const simSlot = ussdRequest.simSlot;
            const request = ussdRequest.request;
            const response = ussdRequest.response;

            // Do whatever you want with the USSD data

            return res.status(200).send("USSD request received successfully!");
        } else {
            return res.status(400).send("Bad Request!");
        }
    } catch (error) {
        console.error("Error processing webhook:", error.message);
        return res.status(500).send("Internal Server Error");
    }
});

// Endpoint to Fetch Webhook Requests from Cache
app.get("/fetch-webhook-requests", (req, res) => {
    const mobileNumber = req.query.mobileNumber ? req.query.mobileNumber.replace(/ /g, "+") : null;
    const count = req.query.count ? parseInt(req.query.count, 10) : null;

    const limit = count ? parseInt(count, 10) : undefined;

    const requests = cacheHelper.getRequests({ mobileNumber, count: limit }).sort((a, b) => b.timestamp - a.timestamp);

    res.json(requests);
});

// Endpoint to Flush Cache
app.delete("/flush-cache", (req, res) => {
    cacheHelper.flushCache();
    res.json({ message: "🧹 Cache flushed successfully!" });
});

const port = process.env.PORT || 5000;
// Start Server
app.listen(port, "0.0.0.0", () => {
    console.log(`🚀 Backend running at http://172.16.0.204:5000`);
});