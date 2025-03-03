const express = require('express');
const axios = require('axios');
const cors = require('cors');
const bodyParser = require("body-parser");
const crypto = require("crypto");
const cacheHelper = require("./helpers/cacheHelper");

const app = express();
const API_KEY = "1e9be4c77b8d80c5b2d4936e5cffa7350887790c";

app.use(cors());
// app.use(bodyParser.urlencoded({ extended: false }));
// app.use(bodyParser.json());
app.use(bodyParser.text({ type: "*/*" }));


app.use((req, res, next) => {
    console.log("incoming request", req.url, new Date());
    next();
})

app.get('/api/webhook-response', async (req, res) => {
    try {
        const response = await axios.get(
            'https://webhook.site/token/5e69efd3-8ab5-465c-8499-2af8a7dbf23f/requests?sorting=newest&per_page=10'
        );
        res.json(response.data);
    } catch (error) {
        console.error('Webhook Error:', error.message);
        res.status(500).json({ error: 'Failed to fetch webhook data' });
    }
});

app.post("/webhook", (req, res) => {
    try {
        const signature = req.headers["x-sg-signature"];
        if (!signature) {
            console.error("Signature not found!");
            return res.status(400).send("Signature not found!");
        }

        if (req.body.messages) {
            /* const messagesString = JSON.stringify(req.body.messages);
            const hash = crypto.createHmac("sha256", API_KEY).update(messagesString).digest("base64");

            console.log({
                hash,
                signature
            }) */
            const rawBody = req.body; // Get raw body as string

            const hash = crypto.createHmac("sha256", API_KEY)
                .update(rawBody) // Use raw body instead of JSON.stringify
                .digest("base64");

            console.log({ hash, signature });
            if (hash === signature) {
                const messages = req.body.messages;
                console.log("signature matches")
                messages.forEach((message) => {
                    console.log("Received Message:", message);

                    if (message.message.toLowerCase() === "hi") {
                        console.log("Replying to: ", message.number);
                        // You can add API call here to send an automated response.
                    }
                });

                return res.status(200).send("Webhook received successfully!");
                // } else {
                //     throw new Error("Signature doesn't match!");
                // }
            }

        } else if (req.body.ussdRequest) {
            const ussdString = JSON.stringify(req.body.ussdRequest);
            const hash = crypto.createHmac("sha256", API_KEY).update(ussdString).digest("base64");

            console.log({
                hash,
                signature
            })
            if (hash === signature) {
                const { deviceID, simSlot, request, response } = req.body.ussdRequest;
                console.log(`Received USSD Request from device ${deviceID}, SIM Slot: ${simSlot}`);
                console.log(`Request: ${request}, Response: ${response}`);

                return res.status(200).send("USSD request processed!");
            } else {
                // throw new Error("Signature doesn't match!");
                return res.status(400).send("Signature doesn't match!");
            }
        }

        // Store request in cache
        cacheHelper.addRequest({
            timestamp: new Date(),
            data: req.body
        });


    } catch (error) {
        console.error(error.message);
        return res.status(401).send(error.message);
    }
    return res.status(400).send("Bad Request!");
});

app.get("/fetch-webhook-requests", (req, res) => {
    const { mobileNumber, count } = req.query;

    // Convert count to number if provided
    const limit = count ? parseInt(count, 10) : undefined;

    const requests = cacheHelper.getRequests({ mobileNumber, count: limit });

    res.json(requests);
});


app.delete("/flush-cache", (req, res) => {
    cacheHelper.flushCache();
    res.json({ message: "Cache flushed successfully!" });
})

app.listen(5000, '0.0.0.0', () => {
    console.log(`🚀 Backend running at http://172.16.0.204:5000`);
});
