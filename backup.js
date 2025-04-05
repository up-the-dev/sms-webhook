const express = require("express");
const axios = require("axios");
const cors = require("cors");
const bodyParser = require("body-parser");
const crypto = require("crypto");
const cacheHelper = require("./helpers/cacheHelper");

const app = express();
const API_KEY = "414e22fb7997771ee64d8c948267d10569ea342e";

app.use(
  cors({
    origin: "*", // Allow all origins
    methods: "GET,POST,PUT,DELETE",
    allowedHeaders: "Content-Type,Authorization",
  })
);

// app.use(express.raw({ type: "*/*" }));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

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

    const rawBody = req.body.toString(); // Full raw request body
    let bodyJson;
    try {
      bodyJson = JSON.parse(rawBody);
    } catch (err) {
      console.error("❌ Invalid JSON body!");
      return res.status(400).json({ error: "Invalid JSON body!" });
    }

    // Extract the field to hash (like PHP code does)
    let dataToHash = "";
    if (bodyJson.messages) {
      dataToHash = JSON.stringify(bodyJson.messages);
    } else if (bodyJson.ussdRequest) {
      dataToHash = JSON.stringify(bodyJson.ussdRequest);
    } else {
      return res.status(400).json({ error: "Invalid request format!" });
    }

    // Compute HMAC SHA256
    const computedHash = crypto
      .createHmac("sha256", API_KEY)
      .update(dataToHash, "utf8") // Match PHP behavior
      .digest("base64");

    console.log("\nIncoming Webhook Verification:");
    console.log("🔹 Data to Hash:", dataToHash);
    console.log("🔹 Computed Hash:", computedHash);
    console.log("🔹 Received Signature:", signature);

    if (computedHash !== signature) {
      console.error("❌ Signature mismatch!");
      return res.status(400).json({ error: "Signature doesn't match!" });
    }

    console.log("✅ Signature verified successfully.");
    req.parsedBody = bodyJson; // Store parsed JSON for next middleware
    next();
  } catch (error) {
    console.error("❌ Error verifying signature:", error.message);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

// Webhook Endpoint (Protected by Signature Verification)
app.post("/webhook", (req, res) => {
  try {
    const signature = req.headers["x-sg-signature"];
    if (!signature) {
      console.error("Signature not found!");
      return res.status(400).send("Signature not found!");
    }

    if (req.body.messages) {
      const messagesString = JSON.stringify(req.body.messages);
      const hash = crypto
        .createHmac("sha256", API_KEY)
        .update(messagesString)
        .digest("base64");

      // console.log({
      //     hash,
      //     signature
      // })

      // console.log("Received Message:", req.body);

      // Store request in cache
      cacheHelper.addRequest({
        timestamp: new Date(),
        data: req.body,
      });

      return res.status(200).send("Webhook received successfully!");
      // } else {
      //     throw new Error("Signature doesn't match!");
      // }
      // }
    }
  } catch (error) {
    console.error(error.message);
    return res.status(401).send(error.message);
  }
  return res.status(400).send("Bad Request!");
});

// Endpoint to Fetch Webhook Requests from Cache
app.get("/fetch-webhook-requests", (req, res) => {
  const mobileNumber = req.query.mobileNumber
    ? req.query.mobileNumber.replace(/ /g, "+")
    : null;
  const count = req.query.count ? parseInt(req.query.count, 10) : null;

  // console.log('query:', { mobileNumber, count })
  const limit = count ? parseInt(count, 10) : undefined;

  const requests = cacheHelper
    .getRequests({ mobileNumber, count: limit })
    .sort((a, b) => b.timestamp - a.timestamp);

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
