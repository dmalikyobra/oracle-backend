const express = require('express');
const axios = require('axios');
const app = express();
app.use(express.json());

// Replace these with your Safaricom Daraja Sandbox credentials for testing
const consumerKey = "YOUR_CONSUMER_KEY";
const consumerSecret = "YOUR_CONSUMER_SECRET";
const passkey = "YOUR_PASSKEY";
const shortCode = "174379"; // Sandbox Shortcode

app.post('/stkpush', async (req, res) => {
    const phone = req.body.phone;
    const amount = req.body.amount;

    try {
        // 1. Get Access Token
        const auth = Buffer.from(`${consumerKey}:${consumerSecret}`).toString('base64');
        const tokenResponse = await axios.get('https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials', {
            headers: { Authorization: `Basic ${auth}` }
        });
        const accessToken = tokenResponse.data.access_token;

        // 2. Generate Password & Timestamp
        const timestamp = new Date().toISOString().replace(/[-:T.Z]/g, "").slice(0, 14);
        const password = Buffer.from(`${shortCode}${passkey}${timestamp}`).toString('base64');

        // 3. Trigger STK Push
        await axios.post('https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest', {
            "BusinessShortCode": shortCode,
            "Password": password,
            "Timestamp": timestamp,
            "TransactionType": "CustomerPayBillOnline",
            "Amount": amount,
            "PartyA": phone,
            "PartyB": shortCode,
            "PhoneNumber": phone,
            "CallBackURL": "https://mydomain.com/callback", // Change this later
            "AccountReference": "The Oracle",
            "TransactionDesc": "Payment for Oracle Premium"
        }, {
            headers: { Authorization: `Bearer ${accessToken}` }
        });

        res.status(200).send("STK Push Sent Successfully");
    } catch (error) {
        console.error(error);
        res.status(500).send("Failed to initiate STK Push");
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
