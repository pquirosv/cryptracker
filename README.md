# cryptracker

Minimal project with:
- `api/`: Express.js backend for checking Bitcoin testnet balances by extended public key.
- `web/`: React + Vite frontend for entering an extended public key and viewing balance + UTXOs.

## Run backend

```bash
cd api
npm install
npm run start
```

API default URL: `http://localhost:3001`

## Run frontend

```bash
cd web
npm install
npm run dev
```

Frontend default URL: `http://localhost:5173`

If needed, configure API URL in frontend with:

```bash
VITE_API_BASE=http://localhost:3001
```
