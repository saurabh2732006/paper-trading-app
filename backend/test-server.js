const express = require("express");
const app = express();
const PORT = 5000;

// Enable CORS
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});

// Account endpoint
app.get("/api/account", (req, res) => {
  res.json({ username: "demo_user", balance: 10000 });
});

// Tickers endpoint
app.get("/api/tickers", (req, res) => {
  res.json([
    { symbol: "AAPL", price: 150 },
    { symbol: "BTC", price: 28000 }
  ]);
});

// Also handle non-/api paths so frontend using base URL without /api works
app.get("/account", (req, res) => {
  res.json({ username: "demo_user", balance: 10000 });
});

app.get("/tickers", (req, res) => {
  res.json([
    { symbol: "AAPL", price: 150 },
    { symbol: "BTC", price: 28000 }
  ]);
});

// Simple exchange-rate endpoint that proxies to exchangerate.host with fallback
app.get("/api/exchange-rate", async (req, res) => {
  const https = require('https');
  const url = 'https://api.exchangerate.host/latest?base=USD&symbols=INR';

  try {
    https.get(url, (resp) => {
      let data = '';
      resp.on('data', (chunk) => { data += chunk; });
      resp.on('end', () => {
        try {
          const json = JSON.parse(data);
          if (json && json.rates && json.rates.INR) {
            return res.json({ status: 'success', data: { base: 'USD', target: 'INR', rate: json.rates.INR, fetchedFrom: 'external' } });
          }
        } catch (e) {
          // fallthrough to fallback
        }
        // fallback rate
        return res.json({ status: 'success', data: { base: 'USD', target: 'INR', rate: 83.25, fetchedFrom: 'fallback' } });
      });
    }).on('error', () => {
      return res.json({ status: 'success', data: { base: 'USD', target: 'INR', rate: 83.25, fetchedFrom: 'fallback' } });
    });
  } catch (err) {
    return res.json({ status: 'success', data: { base: 'USD', target: 'INR', rate: 83.25, fetchedFrom: 'fallback' } });
  }
});

// Also expose non-/api path for convenience
app.get('/exchange-rate', (req, res) => {
  res.redirect('/api/exchange-rate');
});

// Catch-all route for undefined paths
app.use((req, res) => {
  res.status(404).json({ error: "Route not found" });
});

app.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
});