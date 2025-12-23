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
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0,0,0,0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: '20px',
      overflowY: 'auto',
    }}>
      <div style={{
        background: 'white',
        borderRadius: '12px',
        padding: '48px',
        maxWidth: '1200px',
        width: '100%',
        maxHeight: '90vh',
        overflowY: 'auto',
      }}>
        <div style={{ textAlign: 'center', marginBottom: '48px' }}>
          <h1 style={{ margin: '0 0 16px 0', fontSize: '36px', color: '#333' }}>
            Choose Your Plan
          </h1>
          <p style={{ margin: 0, fontSize: '18px', color: '#666' }}>
            Upgrade to unlock unlimited diagrams and advanced features
          </p>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: '32px',
          marginBottom: '32px',
        }}>
          {tiers.map((tier) => (
            <div
              key={tier.tier}
              style={{
                border: tier.popular ? '2px solid #1168bd' : '1px solid #ddd',
                borderRadius: '12px',
                padding: '32px',
                position: 'relative',
                background: tier.popular ? '#f8fbff' : 'white',
              }}
            >
              {tier.popular && (
                <div style={{
                  position: 'absolute',
                  top: '-12px',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  background: '#1168bd',
                  color: 'white',
                  padding: '4px 16px',
                  borderRadius: '12px',
                  fontSize: '12px',
                  fontWeight: 'bold',
                }}>
                  MOST POPULAR
                </div>
              )}

              <h3 style={{ margin: '0 0 8px 0', fontSize: '24px', color: '#333' }}>
                {tier.name}
              </h3>

              <div style={{ marginBottom: '24px' }}>
                <span style={{ fontSize: '48px', fontWeight: 'bold', color: '#1168bd' }}>
                  {tier.price}
                </span>
                <span style={{ fontSize: '16px', color: '#666', marginLeft: '8px' }}>
                  {tier.period}
                </span>
              </div>

              <ul style={{
                listStyle: 'none',
                padding: 0,
                margin: '0 0 32px 0',
              }}>
                {tier.features.map((feature, index) => (
                  <li
                    key={index}
                    style={{
                      padding: '12px 0',
                      borderBottom: '1px solid #eee',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      fontSize: '14px',
                      color: '#555',
                    }}
                  >
                    <span style={{ color: '#4caf50', fontSize: '18px' }}>✓</span>
                    {feature}
                  </li>
                ))}
              </ul>

              <button
                onClick={() => !tier.disabled && tier.tier !== 'free' && handleSubscribe(tier.tier as 'pro' | 'team')}
                disabled={tier.disabled || currentTier === tier.tier || loading !== null}
                style={{
                  width: '100%',
                  padding: '16px',
                  background: tier.disabled || currentTier === tier.tier ? '#e0e0e0' : tier.popular ? '#1168bd' : '#333',
                  color: tier.disabled || currentTier === tier.tier ? '#999' : 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '16px',
                  fontWeight: 'bold',
                  cursor: tier.disabled || currentTier === tier.tier || loading !== null ? 'not-allowed' : 'pointer',
                  opacity: loading === tier.tier ? 0.7 : 1,
                }}
              >
                {loading === tier.tier ? 'Loading...' : currentTier === tier.tier ? 'Current Plan' : tier.cta}
              </button>
            </div>
          ))}
        </div>

        <div style={{ textAlign: 'center' }}>
          <button
            onClick={onClose}
            style={{
              padding: '12px 32px',
              background: '#f5f5f5',
              border: 'none',
              borderRadius: '8px',
              fontSize: '16px',
              cursor: 'pointer',
            }}
          >
            Close
          </button>
        </div>

        <div style={{
          marginTop: '32px',
          padding: '24px',
          background: '#f9f9f9',
          borderRadius: '8px',
          fontSize: '14px',
          color: '#666',
        }}>
          <p style={{ margin: '0 0 8px 0', fontWeight: 'bold', color: '#333' }}>
            💳 Secure Payment
          </p>
          <p style={{ margin: 0 }}>
            All payments are processed securely through Stripe. You can cancel or change your subscription at any time.
          </p>
        </div>
      </div>
    </div>
  );
}
