const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const { Pool } = require('pg');
const { v4: uuidv4 } = require('uuid');
const jwt = require('jsonwebtoken');
const { spawn } = require('child_process');
const axios = require('axios');
const mpesa = require('./services/mpesa');

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

// --- Auth helpers ---
function generateOtpCode() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

async function sendSmsSimulation(phone, message) {
  // Replace with real SMS provider integration. For now log and return true.
  console.log(`SMS to ${phone}: ${message}`);
  return true;
}

function authenticateToken(req, res, next) {
  const auth = req.headers['authorization'];
  if (!auth) return res.status(401).json({ error: 'missing token' });
  const token = auth.split(' ')[1];
  jwt.verify(token, process.env.JWT_SECRET || 'devsecret', (err, payload) => {
    if (err) return res.status(403).json({ error: 'invalid token' });
    req.user = payload;
    next();
  });
}

app.get('/', (req, res) => res.json({ message: 'AI MicroBank API Running' }));

app.post('/api/register', async (req, res) => {
  const { phone, full_name } = req.body;
  if (!phone) return res.status(400).json({ error: 'phone required' });

  try {
    const id = uuidv4();
    const result = await pool.query(
      'INSERT INTO users(id, phone, full_name, ai_identity_score) VALUES($1,$2,$3,$4) RETURNING *',
      [id, phone, full_name || null, 0]
    );

    await pool.query(
      'INSERT INTO wallets(id, user_id, balance, currency) VALUES($1,$2,$3,$4)',
      [uuidv4(), id, 0, 'KES']
    );

    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'db error' });
  }
});

app.post('/api/login', async (req, res) => {
  const { phone } = req.body;
  if (!phone) return res.status(400).json({ error: 'phone required' });

  try {
    const result = await pool.query('SELECT * FROM users WHERE phone=$1', [phone]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'not found' });
    const user = result.rows[0];
    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET || 'devsecret', { expiresIn: '7d' });
    res.json({ user, token });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'db error' });
  }
});

// Request OTP for phone (creates OTP entry and simulates SMS)
app.post('/api/auth/request-otp', async (req, res) => {
  const { phone } = req.body;
  if (!phone) return res.status(400).json({ error: 'phone required' });
  try {
    const code = generateOtpCode();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes
    const id = uuidv4();
    await pool.query('INSERT INTO otps(id, phone, code, expires_at) VALUES($1,$2,$3,$4)', [id, phone, code, expiresAt]);
    await sendSmsSimulation(phone, `Your Hauzral OTP is ${code}`);
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'otp error' });
  }
});

// Verify OTP and issue JWT
app.post('/api/auth/verify-otp', async (req, res) => {
  const { phone, code } = req.body;
  if (!phone || !code) return res.status(400).json({ error: 'missing' });
  try {
    const q = await pool.query('SELECT * FROM otps WHERE phone=$1 AND code=$2 AND used=FALSE ORDER BY created_at DESC LIMIT 1', [phone, code]);
    if (q.rows.length === 0) return res.status(400).json({ error: 'invalid code' });
    const otp = q.rows[0];
    if (new Date(otp.expires_at) < new Date()) return res.status(400).json({ error: 'expired' });

    await pool.query('UPDATE otps SET used=TRUE WHERE id=$1', [otp.id]);

    // Find or create user
    let u = await pool.query('SELECT * FROM users WHERE phone=$1', [phone]);
    let user;
    if (u.rows.length === 0) {
      const id = uuidv4();
      const r = await pool.query('INSERT INTO users(id, phone, ai_identity_score) VALUES($1,$2,$3) RETURNING *', [id, phone, 0]);
      user = r.rows[0];
      await pool.query('INSERT INTO wallets(id, user_id, balance, currency) VALUES($1,$2,$3,$4)', [uuidv4(), user.id, 0, 'KES']);
    } else {
      user = u.rows[0];
    }

    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET || 'devsecret', { expiresIn: '7d' });
    res.json({ user, token });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'verify error' });
  }
});

// MPESA STK Push endpoint
app.post('/api/mpesa/stk', async (req, res) => {
  const { phone, amount, accountReference, description } = req.body;
  if (!phone || !amount) return res.status(400).json({ error: 'missing' });
  try {
    const result = await mpesa.stkPush({ phone, amount, accountReference, description });
    res.json({ result });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'mpesa error', detail: err.message });
  }
});

app.get('/api/wallet/:userId', async (req, res) => {
  const { userId } = req.params;
  try {
    const result = await pool.query('SELECT * FROM wallets WHERE user_id=$1', [userId]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'wallet not found' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'db error' });
  }
});

app.post('/api/transfer', async (req, res) => {
  const { senderWallet, receiverWallet, amount } = req.body;
  if (!senderWallet || !receiverWallet || !amount) return res.status(400).json({ error: 'missing' });

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const s = await client.query('SELECT balance FROM wallets WHERE id=$1 FOR UPDATE', [senderWallet]);
    if (s.rows.length === 0) throw new Error('sender not found');
    if (Number(s.rows[0].balance) < Number(amount)) throw new Error('insufficient funds');

    await client.query('UPDATE wallets SET balance = balance - $1 WHERE id=$2', [amount, senderWallet]);
    await client.query('UPDATE wallets SET balance = balance + $1 WHERE id=$2', [amount, receiverWallet]);

    await client.query(
      'INSERT INTO transactions(id, sender_wallet, receiver_wallet, amount, transaction_type, status) VALUES($1,$2,$3,$4,$5,$6)',
      [uuidv4(), senderWallet, receiverWallet, amount, 'transfer', 'COMPLETED']
    );

    await client.query('COMMIT');
    res.json({ success: true });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error(err);
    res.status(400).json({ error: err.message });
  } finally {
    client.release();
  }
});

app.post('/api/loan/apply', async (req, res) => {
  const { userId, amount, features } = req.body;
  if (!userId || !amount) return res.status(400).json({ error: 'missing' });

  try {
    const py = spawn('python3', ['ai/risk_model.py']);
    const input = JSON.stringify({ userId, amount, features });
    let out = '';
    let errOut = '';

    py.stdin.write(input);
    py.stdin.end();

    py.stdout.on('data', (d) => (out += d.toString()));
    py.stderr.on('data', (d) => (errOut += d.toString()));

    py.on('close', async (code) => {
      if (errOut) console.error('ai error', errOut);
      let decision;
      try {
        decision = JSON.parse(out);
      } catch (e) {
        console.error('ai parse', e);
        decision = { approved: false };
      }

      const id = uuidv4();
      await pool.query(
        'INSERT INTO loans(id, user_id, amount, interest_rate, repayment_status, ai_risk_score) VALUES($1,$2,$3,$4,$5,$6)',
        [id, userId, amount, decision.interest || null, decision.approved ? 'PENDING' : 'REJECTED', decision.score || null]
      );

      res.json({ decision });
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'ai call failed' });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log('Server running on port', PORT));
