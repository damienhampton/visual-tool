import { useState } from 'react';
import { api } from '../lib/api';

interface PricingPageProps {
  onClose: () => void;
  currentTier?: string;
}

export function PricingPage({ onClose, currentTier = 'free' }: PricingPageProps) {
  const [loading, setLoading] = useState<string | null>(null);

  const handleSubscribe = async (tier: 'pro' | 'team') => {
    setLoading(tier);
    try {
      const response = await api.post('/subscriptions/checkout', {
        tier,
        successUrl: `${window.location.origin}?subscription=success`,
        cancelUrl: `${window.location.origin}?subscription=canceled`,
      });

      if (response.data.url) {
        window.location.href = response.data.url;
      }
    } catch (error) {
      console.error('Failed to create checkout session:', error);
      alert('Failed to start checkout. Please try again.');
      setLoading(null);
    }
  };

  const tiers = [
    {
      name: 'Free',
      price: '$0',
      period: 'forever',
      tier: 'free',
      features: [
        '3 diagrams maximum',
        'Guest collaboration (view-only)',
        'Basic export (PNG)',
        'Community support',
      ],
      cta: 'Current Plan',
      disabled: true,
    },
    {
      name: 'Pro',
      price: '$9',
      period: 'per month',
      tier: 'pro',
      popular: true,
      features: [
        'Unlimited diagrams',
        'Unlimited collaborators',
        'Real-time collaboration',
        'Version history (30 days)',
        'Priority support',
        'Advanced exports (SVG, JSON)',
      ],
      cta: 'Upgrade to Pro',
      disabled: false,
    },
    {
      name: 'Team',
      price: '$29',
      period: 'per month',
      tier: 'team',
      features: [
        'Everything in Pro',
        'Team workspaces',
        'Admin controls',
        'Version history (unlimited)',
        'API access',
        'SSO (coming soon)',
      ],
      cta: 'Upgrade to Team',
      disabled: false,
    },
  ];

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[1000] p-5 overflow-y-auto">
      <div className="bg-white rounded-xl p-12 max-w-[1200px] w-full max-h-[90vh] overflow-y-auto">
        <div className="text-center mb-12">
          <h1 className="m-0 mb-4 text-4xl font-bold text-gray-800">
            Choose Your Plan
          </h1>
          <p className="m-0 text-lg text-gray-600">
            Upgrade to unlock unlimited diagrams and advanced features
          </p>
        </div>

        <div className="grid grid-cols-[repeat(auto-fit,minmax(300px,1fr))] gap-8 mb-8">
          {tiers.map((tier) => (
            <div
              key={tier.tier}
              className={`rounded-xl p-8 relative ${
                tier.popular ? 'border-2 border-blue-600 bg-blue-50/30' : 'border border-gray-300 bg-white'
              }`}
            >
              {tier.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-blue-600 text-white px-4 py-1 rounded-xl text-xs font-bold">
                  MOST POPULAR
                </div>
              )}

              <h3 className="m-0 mb-2 text-2xl font-bold text-gray-800">
                {tier.name}
              </h3>

              <div className="mb-6">
                <span className="text-5xl font-bold text-blue-600">
                  {tier.price}
                </span>
                <span className="text-base text-gray-600 ml-2">
                  {tier.period}
                </span>
              </div>

              <ul className="list-none p-0 m-0 mb-8">
                {tier.features.map((feature, index) => (
                  <li
                    key={index}
                    className="py-3 border-b border-gray-200 flex items-center gap-2 text-sm text-gray-700"
                  >
                    <span className="text-green-600 text-lg">✓</span>
                    {feature}
                  </li>
                ))}
              </ul>

              <button
                onClick={() => !tier.disabled && tier.tier !== 'free' && handleSubscribe(tier.tier as 'pro' | 'team')}
                disabled={tier.disabled || currentTier === tier.tier || loading !== null}
                className={`w-full py-4 rounded-lg text-base font-semibold transition-colors ${
                  tier.disabled || currentTier === tier.tier
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : tier.popular
                    ? 'bg-blue-600 text-white hover:bg-blue-700'
                    : 'bg-gray-800 text-white hover:bg-gray-900'
                } ${loading === tier.tier ? 'opacity-70' : ''}`}
              >
                {loading === tier.tier ? 'Loading...' : currentTier === tier.tier ? 'Current Plan' : tier.cta}
              </button>
            </div>
          ))}
        </div>

        <div className="text-center">
          <button
            onClick={onClose}
            className="py-3 px-8 bg-gray-100 rounded-lg text-base hover:bg-gray-200 transition-colors"
          >
            Close
          </button>
        </div>

        <div className="mt-8 p-6 bg-gray-50 rounded-lg text-sm text-gray-600">
          <p className="m-0 mb-2 font-semibold text-gray-800">
            💳 Secure Payment
          </p>
          <p className="m-0">
            All payments are processed securely through Stripe. You can cancel or change your subscription at any time.
          </p>
        </div>
      </div>
    </div>
  );
}
