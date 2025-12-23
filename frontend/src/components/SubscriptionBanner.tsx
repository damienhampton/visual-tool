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
        <div className={`p-3 px-4 rounded-lg mb-4 flex items-center justify-between border ${
          isAtLimit ? 'bg-orange-50 border-orange-500' : 'bg-blue-50 border-blue-600'
        }`}>
          <div>
            <strong className={isAtLimit ? 'text-orange-800' : 'text-blue-700'}>
              {isAtLimit ? '⚠️ Diagram Limit Reached' : '📊 Approaching Diagram Limit'}
            </strong>
            <p className="mt-1 mb-0 text-sm text-gray-600">
              {isAtLimit 
                ? 'You have reached your limit of 3 diagrams. Upgrade to Pro for unlimited diagrams.'
                : `You have ${usage.diagramCount} of ${usage.diagramLimit} diagrams. Upgrade to Pro for unlimited diagrams.`
              }
            </p>
          </div>
          <button
            onClick={onUpgradeClick}
            className="px-4 py-2 bg-blue-600 text-white rounded text-sm font-semibold whitespace-nowrap hover:bg-blue-700 transition-colors"
          >
            Upgrade Now
          </button>
        </div>
      )}

      <div className="flex items-center justify-between p-3 px-4 bg-gray-100 rounded-lg mb-4">
        <div className="flex items-center gap-4">
          <div>
            <span className="text-xs text-gray-600 uppercase font-bold">
              Current Plan
            </span>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-lg font-bold" style={{ color: tierColors[usage.tier] }}>
                {tierNames[usage.tier]}
              </span>
              {usage.tier !== 'free' && usage.currentPeriodEnd && (
                <span className="text-xs text-gray-500">
                  • Renews {new Date(usage.currentPeriodEnd).toLocaleDateString()}
                </span>
              )}
            </div>
          </div>

          {usage.tier === 'free' && (
            <div className="py-1 px-3 bg-white rounded text-sm text-gray-600">
              {usage.diagramCount} / {usage.diagramLimit} diagrams
            </div>
          )}
        </div>

        <div className="flex gap-2">
          {usage.tier === 'free' ? (
            <button
              onClick={onUpgradeClick}
              className="px-4 py-2 bg-blue-600 text-white rounded text-sm font-semibold hover:bg-blue-700 transition-colors"
            >
              Upgrade
            </button>
          ) : (
            <button
              onClick={handleManageBilling}
              className="px-4 py-2 bg-white text-gray-800 border border-gray-300 rounded text-sm hover:bg-gray-50 transition-colors"
            >
              Manage Billing
            </button>
          )}
        </div>
      </div>
    </>
  );
}
