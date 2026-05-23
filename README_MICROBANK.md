# AI MicroBank — Minimal Dev Scaffold

Quick start (requires Docker):

1. Start services:

```bash
docker-compose up --build
```

2. Initialize the database (one-time):

```bash
docker exec -i $(docker ps -qf "name=FINTECH-START-UP_db") psql -U micro -d microbank -f /app/database/schema.sql
```

3. API endpoints (http://localhost:5000):

- `GET /` — health
- `POST /api/register` — { phone, full_name }
- `POST /api/login` — { phone }
- `GET /api/wallet/:userId`
- `POST /api/transfer` — { senderWallet, receiverWallet, amount }
- `POST /api/loan/apply` — { userId, amount, features }

AI risk model is in `ai/risk_model.py` and is called by `/api/loan/apply`.

Next steps:
- Add migrations and seed data
- Add authentication middleware and OTP flow
- Integrate Safaricom Daraja for M-Pesa
- Add tests and CI
