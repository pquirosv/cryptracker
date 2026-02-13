import express from 'express';
import cors from 'cors';

const app = express();
const port = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

const XPUB_REGEX = /^(tpub|upub|vpub)[1-9A-HJ-NP-Za-km-z]{90,120}$/;

function validateExtendedPublicKey(xpub) {
  if (!XPUB_REGEX.test(xpub)) {
    return {
      valid: false,
      reason: 'Invalid format. Expected a testnet extended public key (tpub/upub/vpub).'
    };
  }

  return { valid: true, keyType: xpub.slice(0, 4) };
}

async function fetchWalletData(xpub) {
  const response = await fetch(`https://api.blockchair.com/bitcoin/testnet/dashboards/xpub/${xpub}?limit=200`);
  const payload = await response.json();

  if (!response.ok || payload?.context?.error) {
    throw new Error(payload?.context?.error || `External API error: ${response.status}`);
  }

  const data = payload.data?.[xpub];
  if (!data) {
    throw new Error('No wallet data found for this extended public key.');
  }

  const addresses = data.addresses ?? [];
  const utxos = data.utxo ?? [];

  const totalBalanceSats = addresses.reduce((sum, addr) => sum + (addr.balance ?? 0), 0);

  return {
    totalBalanceSats,
    totalBalanceBtc: totalBalanceSats / 100000000,
    utxos: utxos.map((item) => ({
      txid: item.transaction_hash,
      vout: item.index,
      value: item.value,
      address: item.recipient,
      blockId: item.block_id
    }))
  };
}

app.get('/health', (req, res) => {
  res.json({ ok: true });
});

app.post('/api/balance', async (req, res) => {
  const { xpub } = req.body ?? {};

  if (!xpub || typeof xpub !== 'string') {
    return res.status(400).json({ error: 'xpub is required.' });
  }

  const cleaned = xpub.trim();
  const validation = validateExtendedPublicKey(cleaned);
  if (!validation.valid) {
    return res.status(400).json({ error: validation.reason });
  }

  try {
    const walletData = await fetchWalletData(cleaned);

    return res.json({
      keyType: validation.keyType,
      ...walletData
    });
  } catch (error) {
    return res.status(500).json({ error: error.message || 'Unexpected server error.' });
  }
});

app.listen(port, () => {
  console.log(`API listening on port ${port}`);
});
