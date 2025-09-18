import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { PriceTick } from '@/types';

interface PriceChartProps {
  data: PriceTick[];
}

const PriceChart: React.FC<PriceChartProps> = ({ data }) => {
  // Group data by symbol and prepare for chart
  const chartData = React.useMemo(() => {
    const grouped: { [key: string]: PriceTick[] } = {};
    
    data.forEach((tick) => {
      if (!grouped[tick.symbol]) {
        grouped[tick.symbol] = [];
      }
      grouped[tick.symbol].push(tick);
    });

    // Convert to chart format
    const symbols = Object.keys(grouped);
    if (symbols.length === 0) return [];

    const maxLength = Math.max(...symbols.map(symbol => grouped[symbol].length));
    const result = [];

    for (let i = 0; i < maxLength; i++) {
      const point: any = { time: i };
      symbols.forEach(symbol => {
        const tick = grouped[symbol][i];
        if (tick) {
          point[`${symbol}_price`] = tick.price;
        }
      });
      result.push(point);
    }

    return result;
  }, [data]);

  const symbols = React.useMemo(() => {
    return [...new Set(data.map(tick => tick.symbol))];
  }, [data]);

  const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

  if (chartData.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-gray-500">
        <p>No price data available</p>
      </div>
    );
  }

  return (
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis 
            dataKey="time" 
            tick={{ fontSize: 12 }}
            tickFormatter={(value) => `T${value}`}
          />
          <YAxis 
            tick={{ fontSize: 12 }}
            tickFormatter={(value) => `$${value.toFixed(2)}`}
          />
          <Tooltip 
            formatter={(value: number, name: string) => [
              `$${value.toFixed(2)}`, 
              name.replace('_price', '')
            ]}
            labelFormatter={(label) => `Time: ${label}`}
          />
          {symbols.map((symbol, index) => (
            <Line
              key={symbol}
              type="monotone"
              dataKey={`${symbol}_price`}
              stroke={colors[index % colors.length]}
              strokeWidth={2}
              dot={false}
              name={symbol}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default PriceChart;


