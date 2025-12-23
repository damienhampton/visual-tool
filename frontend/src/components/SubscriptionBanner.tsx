import { useState, useEffect } from 'react';
import { subscriptionApi } from '../lib/api';
import type { UsageStats } from '../lib/api';

interface SubscriptionBannerProps {
  onUpgradeClick: () => void;
}

export function SubscriptionBanner({ onUpgradeClick }: SubscriptionBannerProps) {
  const [usage, setUsage] = useState<UsageStats | null>(null);
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    loadUsage();
  }, []);

  const loadUsage = async () => {
    try {
      const data = await subscriptionApi.getUsage();
      setUsage(data);
      
      // Show banner if on free tier and approaching or at limit
      if (data.tier === 'free' && data.diagramCount >= data.diagramLimit - 1) {
        setShowBanner(true);
      }
    } catch (error) {
      console.error('Failed to load usage:', error);
    }
  };

  const handleManageBilling = async () => {
    try {
      const { url } = await subscriptionApi.createBillingPortalSession(window.location.origin);
      window.location.href = url;
    } catch (error) {
      console.error('Failed to open billing portal:', error);
      alert('Failed to open billing portal. Please try again.');
    }
  };

  if (!usage) return null;

  const tierColors = {
    free: '#999',
    pro: '#1168bd',
    team: '#9c27b0',
  };

  const tierNames = {
    free: 'Free',
    pro: 'Pro',
    team: 'Team',
  };

  const isAtLimit = usage.tier === 'free' && usage.diagramCount >= usage.diagramLimit;
  const isNearLimit = usage.tier === 'free' && usage.diagramCount >= usage.diagramLimit - 1;

  return (
    <>
      {showBanner && usage.tier === 'free' && (
        <div style={{
          background: isAtLimit ? '#fff3e0' : '#e3f2fd',
          padding: '12px 16px',
          borderRadius: '8px',
          marginBottom: '16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          border: `1px solid ${isAtLimit ? '#ff9800' : '#1168bd'}`,
        }}>
          <div>
            <strong style={{ color: isAtLimit ? '#e65100' : '#1168bd' }}>
              {isAtLimit ? '⚠️ Diagram Limit Reached' : '📊 Approaching Diagram Limit'}
            </strong>
            <p style={{ margin: '4px 0 0 0', fontSize: '14px', color: '#666' }}>
              {isAtLimit 
                ? 'You have reached your limit of 3 diagrams. Upgrade to Pro for unlimited diagrams.'
                : `You have ${usage.diagramCount} of ${usage.diagramLimit} diagrams. Upgrade to Pro for unlimited diagrams.`
              }
            </p>
          </div>
          <button
            onClick={onUpgradeClick}
            style={{
              padding: '8px 16px',
              background: '#1168bd',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: 'bold',
              whiteSpace: 'nowrap',
            }}
          >
            Upgrade Now
          </button>
        </div>
      )}

      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '12px 16px',
        background: '#f5f5f5',
        borderRadius: '8px',
        marginBottom: '16px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div>
            <span style={{ fontSize: '12px', color: '#666', textTransform: 'uppercase', fontWeight: 'bold' }}>
              Current Plan
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
              <span style={{
                fontSize: '18px',
                fontWeight: 'bold',
                color: tierColors[usage.tier],
              }}>
                {tierNames[usage.tier]}
              </span>
              {usage.tier !== 'free' && usage.currentPeriodEnd && (
                <span style={{ fontSize: '12px', color: '#999' }}>
                  • Renews {new Date(usage.currentPeriodEnd).toLocaleDateString()}
                </span>
              )}
            </div>
          </div>

          {usage.tier === 'free' && (
            <div style={{
              padding: '4px 12px',
              background: 'white',
              borderRadius: '4px',
              fontSize: '14px',
              color: '#666',
            }}>
              {usage.diagramCount} / {usage.diagramLimit} diagrams
            </div>
          )}
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          {usage.tier === 'free' ? (
            <button
              onClick={onUpgradeClick}
              style={{
                padding: '8px 16px',
                background: '#1168bd',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: 'bold',
              }}
            >
              Upgrade
            </button>
          ) : (
            <button
              onClick={handleManageBilling}
              style={{
                padding: '8px 16px',
                background: 'white',
                color: '#333',
                border: '1px solid #ddd',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '14px',
              }}
            >
              Manage Billing
            </button>
          )}
        </div>
      </div>
    </>
  );
}
