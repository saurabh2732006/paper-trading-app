export interface OHLCData {
  time: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume?: number;
}

export interface PriceData {
  symbol: string;
  ts: string;
  price: number;
}

export const chartDataService = {
  // Convert price data to OHLC data for different timeframes
  convertToOHLC: (
    priceData: PriceData[],
    timeframe: '1m' | '5m' | '15m' | '1h' | '1d' = '1h'
  ): OHLCData[] => {
    if (priceData.length === 0) return [];

    // Group data by timeframe
    const groupedData = groupByTimeframe(priceData, timeframe);
    
    // Convert each group to OHLC
    return Object.entries(groupedData).map(([time, prices]) => {
      const sortedPrices = prices.sort((a, b) => new Date(a.ts).getTime() - new Date(b.ts).getTime());
      
      return {
        time,
        open: sortedPrices[0].price,
        high: Math.max(...sortedPrices.map(p => p.price)),
        low: Math.min(...sortedPrices.map(p => p.price)),
        close: sortedPrices[sortedPrices.length - 1].price,
        volume: sortedPrices.length, // Use count as proxy for volume
      };
    }).sort((a, b) => new Date(a.time).getTime() - new Date(b.time).getTime());
  },

  // Generate sample OHLC data for demonstration
  generateSampleOHLC: (symbol: string, days: number = 7): OHLCData[] => {
    const data: OHLCData[] = [];
    const basePrice = getBasePrice(symbol);
    let currentPrice = basePrice;
    
    const now = new Date();
    const startTime = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
    
    // Generate hourly data
    for (let i = 0; i < days * 24; i++) {
      const timestamp = new Date(startTime.getTime() + i * 60 * 60 * 1000);
      
      // Skip weekends for stock symbols
      if (!symbol.includes('-') && (timestamp.getDay() === 0 || timestamp.getDay() === 6)) {
        continue;
      }
      
      const open = currentPrice;
      const volatility = getVolatility(symbol);
      const change = (Math.random() - 0.5) * 2 * volatility * currentPrice;
      const close = Math.max(0.01, open + change);
      const high = Math.max(open, close) + Math.random() * volatility * currentPrice;
      const low = Math.min(open, close) - Math.random() * volatility * currentPrice;
      
      data.push({
        time: timestamp.toISOString(),
        open: Number(open.toFixed(2)),
        high: Number(high.toFixed(2)),
        low: Number(low.toFixed(2)),
        close: Number(close.toFixed(2)),
        volume: Math.floor(Math.random() * 1000000) + 100000,
      });
      
      currentPrice = close;
    }
    
    return data;
  },
};

// Helper functions
function groupByTimeframe(priceData: PriceData[], timeframe: string): Record<string, PriceData[]> {
  const grouped: Record<string, PriceData[]> = {};
  
  priceData.forEach(item => {
    const date = new Date(item.ts);
    let key: string;
    
    switch (timeframe) {
      case '1m':
        key = date.toISOString().slice(0, 16); // YYYY-MM-DDTHH:MM
        break;
      case '5m':
        const minutes = Math.floor(date.getMinutes() / 5) * 5;
        const fiveMinDate = new Date(date);
        fiveMinDate.setMinutes(minutes, 0, 0);
        key = fiveMinDate.toISOString().slice(0, 16);
        break;
      case '15m':
        const quarterMinutes = Math.floor(date.getMinutes() / 15) * 15;
        const quarterDate = new Date(date);
        quarterDate.setMinutes(quarterMinutes, 0, 0);
        key = quarterDate.toISOString().slice(0, 16);
        break;
      case '1h':
        key = date.toISOString().slice(0, 13); // YYYY-MM-DDTHH
        break;
      case '1d':
        key = date.toISOString().slice(0, 10); // YYYY-MM-DD
        break;
      default:
        key = date.toISOString().slice(0, 13);
    }
    
    if (!grouped[key]) {
      grouped[key] = [];
    }
    grouped[key].push(item);
  });
  
  return grouped;
}

function getBasePrice(symbol: string): number {
  const basePrices: Record<string, number> = {
    // US Stocks
    'AAPL': 172.32, 'TSLA': 248.50, 'MSFT': 378.85, 'GOOGL': 142.50, 'AMZN': 155.20,
    'META': 325.40, 'NVDA': 485.30, 'NFLX': 425.80, 'AMD': 125.60, 'INTC': 45.20,
    // Crypto
    'BTC-USD': 43250.00, 'ETH-USD': 2650.00, 'ADA-USD': 0.45, 'SOL-USD': 95.20,
    'MATIC-USD': 0.85, 'DOT-USD': 6.80,
    // Forex
    'EUR-USD': 1.0850, 'GBP-USD': 1.2650, 'USD-JPY': 149.20, 'AUD-USD': 0.6580,
    'USD-CAD': 1.3650, 'USD-CHF': 0.8750,
    // Commodities
    'GOLD': 2045.50, 'SILVER': 24.80, 'OIL': 78.20, 'NATURAL-GAS': 2.85,
    'COPPER': 3.95, 'WHEAT': 6.20,
    // Indices
    'SPY': 445.50, 'QQQ': 385.20, 'IWM': 195.80, 'VIX': 18.50,
  };
  
  return basePrices[symbol] || 100;
}

function getVolatility(symbol: string): number {
  if (symbol.includes('BTC') || symbol.includes('ETH') || symbol.includes('ADA') || 
      symbol.includes('SOL') || symbol.includes('MATIC') || symbol.includes('DOT')) {
    return 0.05; // High volatility for crypto
  } else if (symbol.includes('EUR') || symbol.includes('GBP') || symbol.includes('JPY') || 
             symbol.includes('AUD') || symbol.includes('CAD') || symbol.includes('CHF')) {
    return 0.01; // Low volatility for forex
  } else if (symbol.includes('GOLD') || symbol.includes('SILVER') || symbol.includes('OIL') || 
             symbol.includes('NATURAL-GAS') || symbol.includes('COPPER') || symbol.includes('WHEAT')) {
    return 0.03; // Medium volatility for commodities
  } else if (symbol.includes('SPY') || symbol.includes('QQQ') || symbol.includes('IWM')) {
    return 0.015; // Low volatility for indices
  } else if (symbol.includes('VIX')) {
    return 0.08; // Very high volatility for VIX
  }
  return 0.02; // Default for stocks
}


