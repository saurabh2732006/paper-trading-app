# 📈 Paper Trading App

A full-stack paper trading simulation platform that allows users to practice trading stocks, cryptocurrencies, and other financial instruments using virtual funds in a risk-free environment.

![Paper Trading App](https://img.shields.io/badge/Status-Active-green)
![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?logo=typescript&logoColor=white)
![React](https://img.shields.io/badge/React-61DAFB?logo=react&logoColor=black)
![Node.js](https://img.shields.io/badge/Node.js-339933?logo=node.js&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-646CFF?logo=vite&logoColor=white)

## ✨ Features

### 🎯 Core Trading Features
- **Real-Time Market Simulation** - WebSocket-driven live price updates
- **Order Management** - Market and limit orders with instant matching
- **Portfolio Tracking** - Real-time P&L, positions, and cash balance
- **Multi-Asset Support** - Stocks, cryptocurrencies, forex, commodities, and indices
- **Transaction History** - Complete audit trail of all trading activities

### 🎨 User Experience
- **Modern UI/UX** - Professional trading interface with responsive design
- **Real-Time Charts** - Live price charts and market data visualization
- **Dark/Light Mode** - Theme switching for comfortable trading
- **Mobile Responsive** - Optimized for desktop, tablet, and mobile devices
- **Multi-Currency Support** - USD/INR with real-time exchange rates

### 🔧 Technical Features
- **Type-Safe Development** - Full TypeScript implementation
- **Real-Time Updates** - WebSocket connections for live data
- **Enhanced Error Handling** - Comprehensive network error recovery
- **Automatic Retry Logic** - Resilient API and WebSocket connections
- **Performance Optimized** - Fast order execution and UI responsiveness

## 🏗️ Architecture

### Frontend
- **React 18** with **Vite** for fast development
- **TypeScript** for type safety
- **Tailwind CSS** for modern styling
- **SWR** for data fetching and caching
- **React Hook Form** for form management
- **React Hot Toast** for notifications

### Backend
- **Node.js** with **Express.js** framework
- **Prisma ORM** with SQLite database
- **WebSocket** server for real-time updates
- **JWT Authentication** for security
- **Comprehensive Error Handling** with automatic recovery

## 🚀 Quick Start

### Prerequisites
- **Node.js** >= 18.0.0
- **Yarn** >= 1.22.0

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/[your-username]/paper-trading-app.git
   cd paper-trading-app
   ```

2. **Install dependencies**
   ```bash
   yarn install
   ```

3. **Set up the database**
   ```bash
   yarn prisma:migrate
   yarn prisma:seed
   ```

4. **Start development servers**
   ```bash
   yarn dev
   ```

5. **Access the application**
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:3001
   - Health Check: http://localhost:3001/health

## 📁 Project Structure

```
paper-trading-app/
├── frontend/                 # React + Vite frontend
│   ├── src/
│   │   ├── components/      # Reusable UI components
│   │   ├── pages/          # Page components
│   │   ├── hooks/          # Custom React hooks
│   │   ├── contexts/       # React contexts
│   │   ├── lib/           # API clients and utilities
│   │   └── types/         # TypeScript type definitions
│   └── public/            # Static assets
├── backend/                 # Node.js + Express backend
│   ├── src/
│   │   ├── routes/        # API route handlers
│   │   ├── services/      # Business logic services
│   │   ├── middleware/    # Express middleware
│   │   ├── utils/         # Utility functions
│   │   └── websocket/     # WebSocket server
│   └── prisma/           # Database schema and migrations
└── docs/                  # Documentation
```

## 🛠️ Available Scripts

### Root Level
- `yarn dev` - Start both frontend and backend in development mode
- `yarn build` - Build both frontend and backend for production
- `yarn test` - Run all tests
- `yarn lint` - Lint all code
- `yarn typecheck` - Type check all TypeScript files

### Database Operations
- `yarn prisma:generate` - Generate Prisma client
- `yarn prisma:migrate` - Run database migrations
- `yarn prisma:seed` - Seed database with sample data
- `yarn prisma:reset` - Reset database and reseed

## 🔧 Configuration

### Environment Variables

Create `.env` files in the backend directory:

```env
# Database
DATABASE_URL="file:./dev.db"

# Authentication
JWT_SECRET="your-super-secret-jwt-key-change-this-in-production"
JWT_EXPIRES_IN="7d"

# Server Configuration
PORT=3001
NODE_ENV="development"

# WebSocket Configuration
WS_PORT=3002

# Price Engine Configuration
PRICE_TICK_INTERVAL=1000
PRICE_NOISE_FACTOR=0.001
```

## 🌟 Key Improvements

### Network Resilience
- **Automatic Port Retry** - Server tries alternative ports if default is busy
- **Connection Recovery** - Automatic reconnection for WebSocket and API calls
- **Enhanced Error Handling** - User-friendly error messages with retry options
- **Request Timeout** - 10-second timeout with exponential backoff retry

### User Experience Enhancements
- **Modern Interface** - Professional trading UI with improved layouts
- **Loading States** - Skeleton animations and progress indicators
- **Error Boundaries** - Graceful error handling with recovery options
- **Toast Notifications** - Real-time feedback for user actions
- **Responsive Design** - Mobile-first approach with hamburger navigation

## 🧪 Testing

```bash
# Run all tests
yarn test

# Run frontend tests
cd frontend && yarn test

# Run backend tests
cd backend && yarn test

# Run E2E tests
yarn test:e2e
```

## 📝 API Documentation

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `POST /api/auth/reset` - Reset user account

### Trading
- `GET /api/tickers` - Get all available tickers
- `POST /api/orders` - Create new order
- `GET /api/orders` - Get user orders
- `DELETE /api/orders/:id` - Cancel order

### Account
- `GET /api/account` - Get account snapshot
- `GET /api/account/positions` - Get user positions
- `GET /api/account/history` - Get transaction history

### WebSocket
- `ws://localhost:3001/ws/prices?userId={userId}` - Real-time price updates

## 🚀 Deployment

### Using Docker

```bash
# Development
docker-compose -f docker-compose.dev.yml up --build

# Production
docker-compose up --build -d
```

### Manual Deployment

1. Build the application
   ```bash
   yarn build
   ```

2. Set production environment variables

3. Start the production server
   ```bash
   yarn start
   ```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **TradingView** for the Lightweight Charts library
- **Prisma** for the excellent ORM
- **Vite** for the fast build tool
- **Tailwind CSS** for the utility-first CSS framework

## 📞 Support

If you have any questions or need help, please:
- Open an issue on GitHub
- Check the documentation in the `/docs` folder
- Review the API documentation above

---

**Made with ❤️ for traders and developers**