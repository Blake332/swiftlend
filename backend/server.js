const express = require('express');
const axios = require('axios');
const cors = require('cors');
const bodyParser = require('body-parser');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(bodyParser.json());

const PORT = process.env.PORT || 5000;

// Middleware to get M-Pesa Access Token
const getAccessToken = async (req, res, next) => {
    const key = process.env.MPESA_CONSUMER_KEY;
    const secret = process.env.MPESA_CONSUMER_SECRET;
    
    if (!key || !secret) {
        return res.status(500).json({ error: "M-Pesa Consumer Key or Secret is missing in .env" });
    }

    const auth = Buffer.from(`${key}:${secret}`).toString('base64');

    try {
        const response = await axios.get(
            'https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials',
            {
                headers: {
                    Authorization: `Basic ${auth}`,
                },
            }
        );
        req.access_token = response.data.access_token;
        next();
    } catch (error) {
        console.error("Error getting access token:", error.response ? error.response.data : error.message);
        res.status(500).json({ error: "Failed to authenticate with M-Pesa" });
    }
};

// STK Push Endpoint
app.post('/api/stkpush', getAccessToken, async (req, res) => {
    const { phone, amount } = req.body;
    const paymentAmount = amount || 250;

    if (!phone) {
        return res.status(400).json({ error: "Phone number is required" });
    }

    // Format phone: 254XXXXXXXXX
    let formattedPhone = phone.replace(/\D/g, '');
    if (formattedPhone.startsWith('0')) {
        formattedPhone = '254' + formattedPhone.substring(1);
    } else if (formattedPhone.startsWith('254')) {
        // Already formatted
    } else if (formattedPhone.length === 9) {
        formattedPhone = '254' + formattedPhone;
    }

    const shortCode = process.env.MPESA_SHORTCODE;
    const passkey = process.env.MPESA_PASSKEY;
    const timestamp = new Date().toISOString().replace(/[^0-9]/g, '').slice(0, 14);
    const password = Buffer.from(`${shortCode}${passkey}${timestamp}`).toString('base64');

    const payload = {
        BusinessShortCode: shortCode,
        Password: password,
        Timestamp: timestamp,
        TransactionType: "CustomerPayBillOnline",
        Amount: paymentAmount,
        PartyA: formattedPhone,
        PartyB: shortCode,
        PhoneNumber: formattedPhone,
        CallBackURL: process.env.MPESA_CALLBACK_URL,
        AccountReference: "SwiftLend",
        TransactionDesc: "Loan Qualification Fee"
    };

    try {
        const response = await axios.post(
            'https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest',
            payload,
            {
                headers: {
                    Authorization: `Bearer ${req.access_token}`,
                },
            }
        );
        res.status(200).json({
            success: true,
            message: "STK Push initiated successfully",
            data: response.data
        });
    } catch (error) {
        console.error("STK Push error:", error.response ? error.response.data : error.message);
        res.status(500).json({ 
            success: false, 
            error: "STK push failed", 
            details: error.response ? error.response.data : error.message 
        });
    }
});

// Mock Callback Endpoint (for documentation)
app.post('/api/callback', (req, res) => {
    console.log("M-Pesa Callback Received:", JSON.stringify(req.body, null, 2));
    res.status(200).send("OK");
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
