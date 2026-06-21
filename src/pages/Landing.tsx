import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Card } from '../components/ui';
import {
  Wallet,
  BookOpen,
  Package,
  Play,
  Server,
  Shield,
  Zap,
  Globe,
  ChevronRight,
  ArrowRight,
  CheckCircle
} from 'lucide-react';

const features = [
  { icon: BookOpen, title: 'Premium Courses', description: 'Access high-quality courses from industry experts' },
  { icon: Package, title: 'Digital Products', description: 'Download exclusive digital products and resources' },
  { icon: Play, title: 'Streaming Accounts', description: 'Get access to Netflix, IPTV, and more' },
  { icon: Server, title: 'Premium Proxies', description: 'High-speed proxies for all your needs' },
  { icon: Shield, title: 'Secure Platform', description: 'Your data and payments are always protected' },
  { icon: Zap, title: 'Instant Access', description: 'Get immediate access after payment' }
];

const pricingPlans = [
  { currency: 'XAF', amount: 1800, symbol: 'FCFA' },
  { currency: 'USD', amount: 3, symbol: '$' },
  { currency: 'EUR', amount: 3, symbol: '€' },
];

export const Landing: React.FC = () => {
  const navigate = useNavigate();
  const [selectedCurrency, setSelectedCurrency] = React.useState(0);

  return (
    <div className="min-h-screen bg-[#0a0a0f]">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-600/20 via-purple-600/10 to-transparent" />
        <div className="absolute top-20 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-indigo-600/20 rounded-full blur-3xl" />
        
        <div className="relative max-w-7xl mx-auto px-4 py-16 md:py-24">
          <div className="text-center max-w-3xl mx-auto">
            {/* Logo */}
            <div className="flex items-center justify-center gap-3 mb-6">
              <div className="w-14 h-14 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center">
                <Wallet className="w-7 h-7 text-white" />
              </div>
              <span className="text-3xl font-bold text-white">WebCash</span>
            </div>

            <h1 className="text-3xl md:text-5xl font-bold text-white mb-4 leading-tight">
              Your Gateway to
              <span className="bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent"> Digital Products</span>
            </h1>
            
            <p className="text-base text-gray-400 mb-8 max-w-2xl mx-auto">
              Access premium courses, streaming accounts, proxies, and digital products. 
              All in one platform with instant access after payment.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-8">
              <Button size="lg" onClick={() => navigate('/register')} icon={<ArrowRight className="w-5 h-5" />} iconPosition="right">
                Get Started
              </Button>
              <Button size="lg" variant="outline" onClick={() => navigate('/login')}>
                Sign In
              </Button>
            </div>

            {/* Pricing Preview */}
            <Card className="inline-block">
              <div className="flex items-center gap-2 mb-3">
                {pricingPlans.map((plan, idx) => (
                  <button
                    key={plan.currency}
                    onClick={() => setSelectedCurrency(idx)}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                      selectedCurrency === idx ? 'bg-indigo-600 text-white' : 'bg-[#1e1e2d] text-gray-400 hover:text-white'
                    }`}
                  >
                    {plan.currency}
                  </button>
                ))}
              </div>
              <div className="text-center">
                <div className="text-4xl font-bold text-white mb-1">
                  {pricingPlans[selectedCurrency].symbol}{pricingPlans[selectedCurrency].amount}
                </div>
                <p className="text-gray-400 text-sm">One-time payment for full access</p>
              </div>
            </Card>
          </div>
        </div>
      </div>

      {/* Features Grid */}
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-white mb-2">Everything You Need</h2>
          <p className="text-gray-400">Access premium digital content and services</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {features.map((feature, idx) => {
            const Icon = feature.icon;
            return (
              <Card key={idx} hover padding="lg">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-indigo-600/20 to-purple-600/20 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Icon className="w-6 h-6 text-indigo-400" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-1">{feature.title}</h3>
                    <p className="text-gray-400 text-sm">{feature.description}</p>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      </div>

      {/* How It Works */}
      <div className="bg-[#0d0d12] py-12">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-white mb-2">How It Works</h2>
            <p className="text-gray-400">Get started in 3 simple steps</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { step: '01', title: 'Create Account', desc: 'Sign up with your email and phone number' },
              { step: '02', title: 'Make Payment', desc: 'Pay 1800 XAF via Mobile Money' },
              { step: '03', title: 'Get Access', desc: 'Instantly access all digital products' }
            ].map((item, idx) => (
              <div key={idx} className="text-center">
                <div className="w-14 h-14 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <span className="text-xl font-bold text-white">{item.step}</span>
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">{item.title}</h3>
                <p className="text-gray-400">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Benefits */}
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="grid md:grid-cols-2 gap-8 items-center">
          <div>
            <h2 className="text-2xl font-bold text-white mb-6">Why Choose WebCash?</h2>
            <div className="space-y-3">
              {[
                'Instant access to all premium content',
                'Secure payment via Mobile Money',
                'Multiple streaming accounts available',
                'Daily slot system for fair access',
                '24/7 customer support',
                'Regular content updates'
              ].map((benefit, idx) => (
                <div key={idx} className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0" />
                  <span className="text-gray-300">{benefit}</span>
                </div>
              ))}
            </div>
          </div>
          
          <Card padding="lg">
            <div className="flex items-center gap-3 mb-4">
              <Globe className="w-6 h-6 text-indigo-400" />
              <span className="text-lg font-semibold text-white">Available In</span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {['Cameroon', 'Nigeria', 'Ghana', 'Kenya', 'Ivory Coast', 'Senegal', 'Uganda', 'Tanzania', 'Rwanda'].map(country => (
                <div key={country} className="bg-[#1e1e2d] rounded-lg px-2 py-1.5 text-center">
                  <span className="text-sm text-gray-300">{country}</span>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>

      {/* CTA */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 py-12">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <h2 className="text-2xl font-bold text-white mb-4">Ready to Get Started?</h2>
          <p className="text-white/80 mb-6">Join thousands of users accessing premium digital content</p>
          <Button size="lg" variant="secondary" onClick={() => navigate('/register')} icon={<ChevronRight className="w-5 h-5" />} iconPosition="right">
            Create Account Now
          </Button>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-[#0d0d12] border-t border-[#1e1e2d] py-6">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <div className="flex items-center justify-center gap-2 mb-3">
            <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center">
              <Wallet className="w-4 h-4 text-white" />
            </div>
            <span className="text-lg font-semibold text-white">WebCash</span>
          </div>
          <p className="text-gray-500 text-sm">All rights reserved. 2024</p>
        </div>
      </footer>
    </div>
  );
};
