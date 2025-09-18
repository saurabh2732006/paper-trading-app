import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { BarChart3, TrendingUp, DollarSign, Shield, Users } from 'lucide-react';

const LoginPage: React.FC = () => {
  const [username, setUsername] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!username.trim()) {
      return;
    }

    try {
      setIsLoading(true);
      await login(username.trim());
      navigate('/');
    } catch (error) {
      // Error is handled in the login function
    } finally {
      setIsLoading(false);
    }
  };

  const features = [
    {
      icon: TrendingUp,
      title: 'Real-time Market Data',
      description: 'Track stocks, crypto, forex & commodities'
    },
    {
      icon: DollarSign,
      title: 'Virtual Portfolio',
      description: 'Practice with $100,000 virtual money'
    },
    {
      icon: Shield,
      title: 'Risk-free Trading',
      description: 'Learn without losing real money'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-primary-100 dark:from-gray-900 dark:to-gray-800">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <svg className="w-full h-full" viewBox="0 0 100 100" fill="none">
          <defs>
            <pattern id="grid" width="10" height="10" patternUnits="userSpaceOnUse">
              <path d="M 10 0 L 0 0 0 10" fill="none" stroke="currentColor" strokeWidth="0.5"/>
            </pattern>
          </defs>
          <rect width="100" height="100" fill="url(#grid)" className="text-gray-300 dark:text-gray-600" />
        </svg>
      </div>
      
      <div className="relative flex min-h-screen">
        {/* Left Side - Branding & Features */}
        <div className="hidden lg:flex lg:w-1/2 flex-col justify-center px-12 xl:px-16">
          <div className="max-w-md">
            <div className="flex items-center mb-8">
              <div className="flex items-center justify-center w-16 h-16 bg-primary-600 rounded-xl shadow-lg">
                <BarChart3 className="h-8 w-8 text-white" />
              </div>
              <div className="ml-4">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                  Paper Trading
                </h1>
                <p className="text-gray-600 dark:text-gray-300">
                  Professional Trading Simulator
                </p>
              </div>
            </div>
            
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">
              Master the Markets<br />
              <span className="text-primary-600">Without the Risk</span>
            </h2>
            
            <p className="text-lg text-gray-600 dark:text-gray-300 mb-8">
              Build your trading skills with our advanced simulation platform. Experience real market conditions with zero financial risk.
            </p>
            
            <div className="space-y-4">
              {features.map((feature, index) => {
                const Icon = feature.icon;
                return (
                  <div key={index} className="flex items-start">
                    <div className="flex items-center justify-center w-10 h-10 bg-primary-100 dark:bg-primary-900 rounded-lg mr-4">
                      <Icon className="h-5 w-5 text-primary-600 dark:text-primary-400" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-white">
                        {feature.title}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-300">
                        {feature.description}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
            
            <div className="mt-8 flex items-center text-sm text-gray-500 dark:text-gray-400">
              <Users className="h-4 w-4 mr-2" />
              <span>Trusted by thousands of traders worldwide</span>
            </div>
          </div>
        </div>
        
        {/* Right Side - Login Form */}
        <div className="flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-8">
          <div className="max-w-md w-full">
            {/* Mobile Branding */}
            <div className="lg:hidden text-center mb-8">
              <div className="flex items-center justify-center mb-4">
                <div className="flex items-center justify-center w-16 h-16 bg-primary-600 rounded-xl shadow-lg">
                  <BarChart3 className="h-8 w-8 text-white" />
                </div>
              </div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                Paper Trading
              </h1>
              <p className="text-gray-600 dark:text-gray-300">
                Professional Trading Simulator
              </p>
            </div>
            
            {/* Login Card */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 p-8">
              <div className="text-center mb-8">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                  Welcome Back
                </h2>
                <p className="text-gray-600 dark:text-gray-300">
                  Sign in to continue your trading journey
                </p>
              </div>
              
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label htmlFor="username" className="label">
                    Username
                  </label>
                  <div className="relative">
                    <input
                      id="username"
                      name="username"
                      type="text"
                      required
                      className="input pl-10"
                      placeholder="Enter your username"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      disabled={isLoading}
                    />
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Users className="h-4 w-4 text-gray-400" />
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading || !username.trim()}
                  className="btn btn-primary w-full h-12 text-base font-semibold disabled:opacity-50 disabled:cursor-not-allowed transform transition-transform hover:scale-[1.02] active:scale-[0.98]"
                >
                  {isLoading ? (
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Signing in...
                    </div>
                  ) : (
                    'Start Trading'
                  )}
                </button>
                
                <div className="text-center">
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    🚀 This is a simulation platform — Trade with confidence, risk-free!
                  </p>
                </div>
              </form>
              
              {/* Quick Start Tip */}
              <div className="mt-6 p-4 bg-primary-50 dark:bg-primary-900/20 rounded-lg border border-primary-200 dark:border-primary-800">
                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    <BarChart3 className="h-5 w-5 text-primary-600 dark:text-primary-400" />
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-primary-800 dark:text-primary-200">
                      Quick Start Tip
                    </h3>
                    <p className="text-xs text-primary-700 dark:text-primary-300 mt-1">
                      Use "demo" as username to try the demo account with sample data.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;


