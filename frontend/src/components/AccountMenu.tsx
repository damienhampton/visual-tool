import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { subscriptionApi } from '../lib/api';
import type { UsageStats } from '../lib/api';

interface AccountMenuProps {
  onUpgradeClick: () => void;
}

export function AccountMenu({ onUpgradeClick }: AccountMenuProps) {
  const { user, logout } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [usage, setUsage] = useState<UsageStats | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen && !usage) {
      loadUsage();
    }
  }, [isOpen]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  const loadUsage = async () => {
    setIsLoading(true);
    try {
      const data = await subscriptionApi.getUsage();
      setUsage(data);
    } catch (error) {
      console.error('Failed to load usage:', error);
    } finally {
      setIsLoading(false);
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

  const handleLogout = () => {
    setIsOpen(false);
    logout();
  };

  if (!user) return null;

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

  return (
    <div ref={menuRef} className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 bg-white/10 rounded-lg text-white text-sm font-medium hover:bg-white/20 transition-colors"
      >
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-base font-bold">
          {user.name.charAt(0).toUpperCase()}
        </div>
        <span>{user.name}</span>
        <span className="text-xs">▼</span>
      </button>

      {isOpen && (
        <div className="absolute top-[calc(100%+8px)] right-0 w-80 bg-white rounded-xl shadow-xl z-[1000] overflow-hidden">
          <div className="p-5 border-b border-gray-200">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-2xl font-bold text-white">
                {user.name.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1">
                <div className="font-semibold text-base text-gray-800">
                  {user.name}
                </div>
                {user.email && (
                  <div className="text-sm text-gray-600 mt-0.5">
                    {user.email}
                  </div>
                )}
                {user.isGuest && (
                  <div className="text-xs text-orange-600 mt-1 font-medium">
                    Guest Account
                  </div>
                )}
              </div>
            </div>
          </div>

          {isLoading ? (
            <div className="p-5 text-center text-gray-500">
              Loading subscription info...
            </div>
          ) : usage ? (
            <div className="p-5 border-b border-gray-200">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <div className="text-xs text-gray-600 mb-1">
                    Current Plan
                  </div>
                  <div className="text-xl font-bold" style={{ color: tierColors[usage.tier] }}>
                    {tierNames[usage.tier]}
                  </div>
                </div>
                {usage.tier === 'free' ? (
                  <button
                    onClick={() => {
                      setIsOpen(false);
                      onUpgradeClick();
                    }}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-semibold hover:bg-blue-700 transition-colors"
                  >
                    Upgrade
                  </button>
                ) : (
                  <button
                    onClick={handleManageBilling}
                    className="px-4 py-2 bg-gray-100 text-gray-800 border border-gray-300 rounded-md text-sm hover:bg-gray-200 transition-colors"
                  >
                    Manage
                  </button>
                )}
              </div>

              {usage.tier === 'free' && (
                <div className="p-3 bg-gray-100 rounded-lg text-sm">
                  <div className="text-gray-600 mb-1">
                    Diagrams
                  </div>
                  <div className="font-semibold text-gray-800">
                    {usage.diagramCount} / {usage.diagramLimit} used
                  </div>
                </div>
              )}

              {usage.tier !== 'free' && usage.currentPeriodEnd && (
                <div className="text-xs text-gray-600 mt-2">
                  Renews on {new Date(usage.currentPeriodEnd).toLocaleDateString()}
                </div>
              )}
            </div>
          ) : null}

          <div className="p-2">
            <button
              onClick={handleLogout}
              className="w-full p-3 bg-transparent rounded-md text-sm text-red-700 font-medium text-left hover:bg-red-50 transition-colors"
            >
              Sign Out
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
