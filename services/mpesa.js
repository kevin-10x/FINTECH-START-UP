const axios = require('axios');

const DARaja = {
  oauthUrl: 'https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials',
  stkUrl: 'https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest',
};

async function getAccessToken() {
  const key = process.env.SAFARICOM_CONSUMER_KEY;
  const secret = process.env.SAFARICOM_CONSUMER_SECRET;
  if (!key || !secret) throw new Error('Daraja credentials not set');

  const token = Buffer.from(`${key}:${secret}`).toString('base64');
  const res = await axios.get(DARaja.oauthUrl, {
    headers: { Authorization: `Basic ${token}` },
  });
  return res.data.access_token;
}

function timestamp() {
  const d = new Date();
  const y = d.getFullYear();
  const m = `${d.getMonth() + 1}`.padStart(2, '0');
  const day = `${d.getDate()}`.padStart(2, '0');
  const hh = `${d.getHours()}`.padStart(2, '0');
  const mm = `${d.getMinutes()}`.padStart(2, '0');
  const ss = `${d.getSeconds()}`.padStart(2, '0');
  return `${y}${m}${day}${hh}${mm}${ss}`;
}

async function stkPush({ phone, amount, accountReference = 'Hauzral', description = 'Payment' }) {
  const token = await getAccessToken();
  const shortcode = process.env.MPESA_SHORTCODE;
  const passkey = process.env.MPESA_PASSKEY;
  const time = timestamp();
  const password = Buffer.from(`${shortcode}${passkey}${time}`).toString('base64');

  const body = {
    BusinessShortCode: shortcode,
    Password: password,
    Timestamp: time,
    TransactionType: 'CustomerPayBillOnline',
    Amount: amount,
    PartyA: phone,
    PartyB: shortcode,
    PhoneNumber: phone,
    CallBackURL: process.env.MPESA_CALLBACK_URL || 'https://example.com/mpesa/callback',
    AccountReference: accountReference,
    TransactionDesc: description,
  };

  const res = await axios.post(DARaja.stkUrl, body, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.data;
}

module.exports = { getAccessToken, stkPush };
