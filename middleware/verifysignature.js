const crypto = require("crypto");
const API_KEY = "414e22fb7997771ee64d8c948267d10569ea342e";

// Middleware for signature verification
const verifySignatureMiddleware = (req, res, next) => {
    const signature = req.headers["x-sg-signature"];

    if (!signature) {
        console.error("Signature not found in headers!");
        return res.status(400).json({ error: "Signature not found!" });
    }

    // Determine the payload to verify based on the request body
    let payload;
    if (req.body.messages) {
        // Use the raw stringified JSON for signature verification
        payload = req.body.messages;
    } else if (req.body.ussdRequest) {
        // Use the raw stringified JSON for signature verification
        payload = req.body.ussdRequest;
    } else {
        console.error("Invalid request body: neither 'messages' nor 'ussdRequest' found.");
        return res.status(400).json({ error: "Invalid request body!" });
    }

    // Verify the signature
    const hash = crypto
        .createHmac("sha256", API_KEY)
        .update(payload) // Use the raw stringified JSON
        .digest("base64");

    /*   console.log("Generated signature:", hash);
      console.log("Received signature:", signature); */

    if (hash !== signature) {
        console.error("Signature verification failed!", {
            expectedSignature: hash,
            receivedSignature: signature,
        });
        return res.status(401).json({ error: "Signature doesn't match!" });
    }

    // Log successful signature verification
    /*    console.log("Signature verified successfully!", {
           payload: payload,
           signature: signature,
           timestamp: new Date().toISOString(),
       }); */

    // Proceed to the next middleware or route handler
    next();
};

module.exports = verifySignatureMiddleware;