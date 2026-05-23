/* Pluggable SMS service. Supports Twilio when credentials provided. */
const axios = require('axios');

async function sendViaTwilio(to, body) {
  const sid = process.env.TWILIO_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;
  const from = process.env.TWILIO_PHONE_NUMBER;
  if (!sid || !token || !from) throw new Error('Twilio not configured');

  const url = `https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`;
  const params = new URLSearchParams();
  params.append('From', from);
  params.append('To', to);
  params.append('Body', body);

  const auth = { username: sid, password: token };
  const res = await axios.post(url, params, { auth });
  return res.data;
}

async function sendSms(to, message) {
  try {
    if (process.env.TWILIO_SID && process.env.TWILIO_AUTH_TOKEN) {
      return await sendViaTwilio(to, message);
    }
  } catch (err) {
    console.error('Twilio send failed', err.message);
  }

  // Fallback — log and return success for local/dev
  console.log(`SMS [fallback] to ${to}: ${message}`);
  return { status: 'logged' };
}

module.exports = { sendSms };
