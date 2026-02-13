import { useMemo, useState } from 'react';

const XPUB_REGEX = /^(tpub|upub|vpub)[1-9A-HJ-NP-Za-km-z]{90,120}$/;

const API_BASE = import.meta.env.VITE_API_BASE ?? 'http://localhost:3001';

function App() {
  const [xpub, setXpub] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);

  const isFormatValid = useMemo(() => XPUB_REGEX.test(xpub.trim()), [xpub]);

  async function onSubmit(event) {
    event.preventDefault();

    if (!isFormatValid) {
      setError('Invalid testnet extended public key format. Use tpub/upub/vpub.');
      setResult(null);
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch(`${API_BASE}/api/balance`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ xpub: xpub.trim() })
      });

      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.error || 'Request failed');
      }

      setResult(payload);
    } catch (err) {
      setError(err.message || 'Unexpected error while checking balance.');
      setResult(null);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="layout">
      <h1>Bitcoin Testnet Balance Checker</h1>
      <form className="panel" onSubmit={onSubmit}>
        <label htmlFor="xpub">Extended Public Key</label>
        <input
          id="xpub"
          value={xpub}
          onChange={(e) => setXpub(e.target.value)}
          placeholder="tpub... / upub... / vpub..."
        />
        <button type="submit" disabled={loading}>
          {loading ? 'Checking...' : 'Check balance'}
        </button>
        {xpub.length > 0 && !isFormatValid && (
          <p className="error">Invalid format before sending to API.</p>
        )}
        {error && <p className="error">{error}</p>}
      </form>

      {result && (
        <section className="panel">
          <h2>Result</h2>
          <p><strong>Type:</strong> {result.keyType}</p>
          <p><strong>Total balance:</strong> {result.totalBalanceBtc} BTC ({result.totalBalanceSats} sats)</p>
          <h3>UTXO list ({result.utxos.length})</h3>
          <ul className="utxo-list">
            {result.utxos.map((utxo) => (
              <li key={`${utxo.txid}:${utxo.vout}`}>
                <code>{utxo.txid}:{utxo.vout}</code>
                <span>{utxo.value} sats</span>
                <small>{utxo.address}</small>
              </li>
            ))}
          </ul>
        </section>
      )}
    </main>
  );
}

export default App;
