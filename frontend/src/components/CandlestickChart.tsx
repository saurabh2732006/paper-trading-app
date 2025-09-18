import React, { useEffect, useRef, useState } from 'react';
import { createChart, IChartApi, ISeriesApi, CandlestickData, Time, ColorType } from 'lightweight-charts';
import { useTheme } from '@/contexts/ThemeContext';

interface CandlestickChartProps {
  data: Array<{
    time: string;
    open: number;
    high: number;
    low: number;
    close: number;
    volume?: number;
  }>;
  symbol: string;
  height?: number;
  className?: string;
}

const CandlestickChart: React.FC<CandlestickChartProps> = ({
  data,
  symbol,
  height = 400,
  className = '',
}) => {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<ISeriesApi<'Candlestick'> | null>(null);
  const { isDark } = useTheme();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!chartContainerRef.current) return;

    // Create chart
    const chart = createChart(chartContainerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: isDark ? '#1f2937' : '#ffffff' },
        textColor: isDark ? '#f9fafb' : '#111827',
      },
      grid: {
        vertLines: { color: isDark ? '#374151' : '#e5e7eb' },
        horzLines: { color: isDark ? '#374151' : '#e5e7eb' },
      },
      crosshair: {
        mode: 1,
      },
      rightPriceScale: {
        borderColor: isDark ? '#374151' : '#e5e7eb',
      },
      timeScale: {
        borderColor: isDark ? '#374151' : '#e5e7eb',
        timeVisible: true,
        secondsVisible: false,
      },
      width: chartContainerRef.current.clientWidth,
      height: height,
    });

    // Create candlestick series
    const candlestickSeries = chart.addCandlestickSeries({
      upColor: '#22c55e',
      downColor: '#ef4444',
      borderDownColor: '#ef4444',
      borderUpColor: '#22c55e',
      wickDownColor: '#ef4444',
      wickUpColor: '#22c55e',
    });

    chartRef.current = chart;
    seriesRef.current = candlestickSeries;

    // Set data
    if (data.length > 0) {
      const formattedData: CandlestickData[] = data.map(item => ({
        time: item.time as Time,
        open: item.open,
        high: item.high,
        low: item.low,
        close: item.close,
      }));
      
      candlestickSeries.setData(formattedData);
      setIsLoading(false);
    }

    // Handle resize
    const handleResize = () => {
      if (chartContainerRef.current && chartRef.current) {
        chartRef.current.applyOptions({
          width: chartContainerRef.current.clientWidth,
        });
      }
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (chartRef.current) {
        chartRef.current.remove();
      }
    };
  }, [isDark, height]);

  useEffect(() => {
    if (seriesRef.current && data.length > 0) {
      const formattedData: CandlestickData[] = data.map(item => ({
        time: item.time as Time,
        open: item.open,
        high: item.high,
        low: item.low,
        close: item.close,
      }));
      
      seriesRef.current.setData(formattedData);
      setIsLoading(false);
    }
  }, [data]);

  // Generate sample OHLC data if no data provided
  const generateSampleData = () => {
    const sampleData = [];
    const basePrice = 100;
    let currentPrice = basePrice;
    
    for (let i = 0; i < 50; i++) {
      const open = currentPrice;
      const change = (Math.random() - 0.5) * 10;
      const close = Math.max(0.01, open + change);
      const high = Math.max(open, close) + Math.random() * 5;
      const low = Math.min(open, close) - Math.random() * 5;
      
      sampleData.push({
        time: (Date.now() - (50 - i) * 60000).toString(),
        open: Number(open.toFixed(2)),
        high: Number(high.toFixed(2)),
        low: Number(low.toFixed(2)),
        close: Number(close.toFixed(2)),
      });
      
      currentPrice = close;
    }
    
    return sampleData;
  };

  const chartData = data.length > 0 ? data : generateSampleData();

  return (
    <div className={`relative ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          {symbol} Chart
        </h3>
        {isLoading && (
          <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-600 mr-2"></div>
            Loading...
          </div>
        )}
      </div>
      
      <div 
        ref={chartContainerRef} 
        className="w-full rounded-lg border border-gray-200 dark:border-gray-700"
        style={{ height: `${height}px` }}
      />
      
      {chartData.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-50 dark:bg-gray-800 rounded-lg">
          <div className="text-center">
            <p className="text-gray-500 dark:text-gray-400">No data available</p>
            <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
              Price data will appear here when available
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default CandlestickChart;


