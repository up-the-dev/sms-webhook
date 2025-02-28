const express = require('express');
const axios = require('axios');
const cors = require('cors');
const bodyParser = require("body-parser");
const crypto = require("crypto");

const app = express();
const API_KEY = "sample-api-key-1234#";

app.use(cors());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());


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
            const messagesString = JSON.stringify(req.body.messages);
            const hash = crypto.createHmac("sha256", API_KEY).update(messagesString).digest("base64");

            // if (hash === signature) {
            const messages = req.body.messages;

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
        } else if (req.body.ussdRequest) {
            const ussdString = JSON.stringify(req.body.ussdRequest);
            const hash = crypto.createHmac("sha256", API_KEY).update(ussdString).digest("base64");

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
    } catch (error) {
        console.error(error.message);
        return res.status(401).send(error.message);
    }
    return res.status(400).send("Bad Request!");
});

app.listen(5000, '0.0.0.0', () => {
    console.log(`🚀 Backend running at http://172.16.0.204:5000`);
});
