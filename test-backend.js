const express = require("express");
const cors = require("cors");
const app = express();
const PORT = 3001;

app.use(express.json());
app.use(cors({
  origin: "http://localhost:5173",
  credentials: true
}));

// Test route to verify backend connectivity
app.get("/health", (req, res) => {
  res.json({ status: "Backend is working!", port: PORT });
});

// Mock auth route for testing
app.post("/api/auth/login", (req, res) => {
  const { username } = req.body;
  if (!username) {
    return res.status(400).json({ error: "Username is required" });
  }
  res.json({
    status: "success",
    data: {
      user: { 
        id: 1,
        username, 
        startingCash: 100000 
      }
    }
  });
});

// Mock exchange rate route
app.get("/api/exchange-rate", (req, res) => {
  res.json({
    status: "success",
    data: {
      base: "USD",
      target: "INR",
      rate: 83.2,
      updatedAt: new Date().toISOString()
    }
  });
});

// Mock account routes
app.get("/api/account", (req, res) => {
  res.json({
    status: "success",
    data: {
      cash: 95000,
      totalValue: 105000,
      dayPnL: 2500,
      totalPnL: 5000
    }
  });
});

app.get("/api/account/positions", (req, res) => {
  res.json({
    status: "success",
    data: [
      { symbol: "AAPL", qty: 10, avgPrice: 150, currentPrice: 155, pnl: 50 },
      { symbol: "TSLA", qty: 5, avgPrice: 800, currentPrice: 850, pnl: 250 }
    ]
  });
});

app.get("/api/account/history", (req, res) => {
  res.json({
    status: "success",
    data: [
      { id: 1, symbol: "AAPL", side: "buy", qty: 10, price: 150, status: "filled", createdAt: new Date().toISOString() }
    ]
  });
});

// Mock tickers routes
app.get("/api/tickers", (req, res) => {
  res.json({
    status: "success",
    data: [
      { symbol: "AAPL", price: 155, change: 2.5, changePercent: 1.64 },
      { symbol: "TSLA", price: 850, change: -10, changePercent: -1.16 },
      { symbol: "BTC-USD", price: 45000, change: 1000, changePercent: 2.27 }
    ]
  });
});

// Mock orders routes
app.get("/api/orders", (req, res) => {
  res.json({
    status: "success",
    data: [
      { id: 1, symbol: "AAPL", side: "buy", qty: 10, price: 150, status: "filled", createdAt: new Date().toISOString() }
    ]
  });
});

app.post("/api/orders", (req, res) => {
  const { symbol, side, qty, type, price } = req.body;
  res.json({
    status: "success",
    data: {
      id: Date.now(),
      symbol,
      side,
      qty,
      type,
      price,
      status: "filled",
      createdAt: new Date().toISOString()
    }
  });
});

// Mock logout route
app.post("/api/auth/logout", (req, res) => {
  res.json({
    status: "success",
    message: "Logged out successfully"
  });
});

// Catch all for debugging
app.use("*", (req, res) => {
  console.log(`❌ Route not found: ${req.method} ${req.originalUrl}`);
  res.status(404).json({ 
    status: "error",
    message: "Route not found",
    code: "NOT_FOUND",
    requestedUrl: req.originalUrl,
    method: req.method
  });
});

app.listen(PORT, () => {
  console.log(`✅ Test backend running at http://localhost:${PORT}`);
  console.log(`✅ Health check: http://localhost:${PORT}/health`);
  console.log(`✅ Auth endpoint: POST http://localhost:${PORT}/api/auth/login`);
});
