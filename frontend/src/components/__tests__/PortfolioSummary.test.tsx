import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import PortfolioSummary from '../PortfolioSummary';

describe('PortfolioSummary', () => {
  const mockProps = {
    cash: 50000,
    totalValue: 75000,
    dailyPnL: 2500,
  };

  it('renders portfolio summary with correct values', () => {
    render(<PortfolioSummary {...mockProps} />);

    expect(screen.getByText('Cash Balance')).toBeInTheDocument();
    expect(screen.getByText('$50,000.00')).toBeInTheDocument();

    expect(screen.getByText('Total Value')).toBeInTheDocument();
    expect(screen.getByText('$75,000.00')).toBeInTheDocument();

    expect(screen.getByText('Daily P&L')).toBeInTheDocument();
    expect(screen.getByText('+$2,500.00')).toBeInTheDocument();
    expect(screen.getByText('(+3.33%)')).toBeInTheDocument();
  });

  it('displays negative P&L correctly', () => {
    const negativeProps = {
      ...mockProps,
      dailyPnL: -1500,
    };

    render(<PortfolioSummary {...negativeProps} />);

    expect(screen.getByText('-$1,500.00')).toBeInTheDocument();
    expect(screen.getByText('(-2.00%)')).toBeInTheDocument();
  });

  it('handles zero P&L correctly', () => {
    const zeroProps = {
      ...mockProps,
      dailyPnL: 0,
    };

    render(<PortfolioSummary {...zeroProps} />);

    expect(screen.getByText('$0.00')).toBeInTheDocument();
    expect(screen.getByText('(0.00%)')).toBeInTheDocument();
  });
});


