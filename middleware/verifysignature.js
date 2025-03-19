const crypto = require("crypto");

const API_KEY = "0d08f8225fb0b7a86d939a1d59fbd561fe8156ca";

// Middleware for signature verification
const verifySignatureMiddleware = (req, res, next) => {
    const signature = req.headers["x-sg-signature"];

    // Log incoming request details
    console.log("Incoming request:", {
        method: req.method,
        url: req.url,
        headers: req.headers,
        body: req.body,
        timestamp: new Date().toISOString(),
    });

    if (!signature) {
        console.error("Signature not found in headers!");
        return res.status(400).json({ error: "Signature not found!" });
    }

    // Determine the payload to verify based on the request body
    let payload;
    if (req.body.messages) {
        payload = req.body.messages;
    } else if (req.body.ussdRequest) {
        payload = req.body.ussdRequest;
    } else {
        console.error("Invalid request body: neither 'messages' nor 'ussdRequest' found.");
        return res.status(400).json({ error: "Invalid request body!" });
    }

    // Verify the signature
    const hash = crypto
        .createHmac("sha256", API_KEY)
        .update(JSON.stringify(payload))
        .digest("base64");

    if (hash !== signature) {
        console.error("Signature verification failed!", {
            expectedSignature: hash,
            receivedSignature: signature,
        });
        return res.status(401).json({ error: "Signature doesn't match!" });
    }

    // Log successful signature verification
    console.log("Signature verified successfully!", {
        payload: payload,
        signature: signature,
        timestamp: new Date().toISOString(),
    });

    // Proceed to the next middleware or route handler
    next();
};

module.exports = verifySignatureMiddleware;