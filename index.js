const express = require('express');
const axios = require('axios');
const app = express();
app.use(express.json());

// Your provided credentials
const consumerKey = "gGnOfMjvevm6ZjddxAxsk6o4cse9qbOkqLBZJbAbAR8SGHeK";
const consumerSecret = "TKyl7Db2a466HxCBkYqMTjulbobGurn4mc2AAo4fujAsswYAiBuWYMf7caNGyb55";

// This is the standard Sandbox passkey for testing
const passkey = "bfb279f9aa9bdbcf158e97dd71a467cd2e0c893059b10f78e6b72ada1ed2c919";
const shortCode = "174379"; // Standard Sandbox Paybill

app.post('/stkpush', async (req, res) => {
    const phone = req.body.phone;
    const amount = req.body.amount;

    try {
        // 1. Get Access Token from Safaricom
        const auth = Buffer.from(`${consumerKey}:${consumerSecret}`).toString('base64');
        const tokenResponse = await axios.get('https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials', {
            headers: { Authorization: `Basic ${auth}` }
        });
        const accessToken = tokenResponse.data.access_token;

        // 2. Generate Password & Timestamp
        const timestamp = new Date().toISOString().replace(/[-:T.Z]/g, "").slice(0, 14);
        const password = Buffer.from(`${shortCode}${passkey}${timestamp}`).toString('base64');

        // 3. Trigger STK Push Request
        const stkResponse = await axios.post('https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest', {
            "BusinessShortCode": shortCode,
            "Password": password,
            "Timestamp": timestamp,
            "TransactionType": "CustomerPayBillOnline",
            "Amount": amount,
            "PartyA": phone, // User's phone number
            "PartyB": shortCode,
            "PhoneNumber": phone,
            "CallBackURL": "https://mydomain.com/callback", // Render URL + /callback
            "AccountReference": "The Oracle",
            "TransactionDesc": "Oracle Premium Unlock"
        }, {
            headers: { Authorization: `Bearer ${accessToken}` }
        });

        console.log("Safaricom Response:", stkResponse.data);
        res.status(200).send("STK Push Initiated");

    } catch (error) {
        console.error("Error Details:", error.response ? error.response.data : error.message);
        res.status(500).send("Gateway Error: Check server logs");
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Oracle Backend running on port ${PORT}`));
