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
    <div ref={menuRef} style={{ position: 'relative' }}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '8px 12px',
          background: 'rgba(255,255,255,0.1)',
          border: 'none',
          borderRadius: '8px',
          color: 'white',
          cursor: 'pointer',
          fontSize: '14px',
          fontWeight: '500',
        }}
      >
        <div style={{
          width: '32px',
          height: '32px',
          borderRadius: '50%',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '16px',
          fontWeight: 'bold',
        }}>
          {user.name.charAt(0).toUpperCase()}
        </div>
        <span>{user.name}</span>
        <span style={{ fontSize: '12px' }}>▼</span>
      </button>

      {isOpen && (
        <div style={{
          position: 'absolute',
          top: 'calc(100% + 8px)',
          right: 0,
          width: '320px',
          background: 'white',
          borderRadius: '12px',
          boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
          zIndex: 1000,
          overflow: 'hidden',
        }}>
          <div style={{
            padding: '20px',
            borderBottom: '1px solid #eee',
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              marginBottom: '12px',
            }}>
              <div style={{
                width: '48px',
                height: '48px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '24px',
                fontWeight: 'bold',
                color: 'white',
              }}>
                {user.name.charAt(0).toUpperCase()}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 'bold', fontSize: '16px', color: '#333' }}>
                  {user.name}
                </div>
                {user.email && (
                  <div style={{ fontSize: '14px', color: '#666', marginTop: '2px' }}>
                    {user.email}
                  </div>
                )}
                {user.isGuest && (
                  <div style={{
                    fontSize: '12px',
                    color: '#ff9800',
                    marginTop: '4px',
                    fontWeight: '500',
                  }}>
                    Guest Account
                  </div>
                )}
              </div>
            </div>
          </div>

          {isLoading ? (
            <div style={{ padding: '20px', textAlign: 'center', color: '#999' }}>
              Loading subscription info...
            </div>
          ) : usage ? (
            <div style={{ padding: '20px', borderBottom: '1px solid #eee' }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '12px',
              }}>
                <div>
                  <div style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>
                    Current Plan
                  </div>
                  <div style={{
                    fontSize: '20px',
                    fontWeight: 'bold',
                    color: tierColors[usage.tier],
                  }}>
                    {tierNames[usage.tier]}
                  </div>
                </div>
                {usage.tier === 'free' ? (
                  <button
                    onClick={() => {
                      setIsOpen(false);
                      onUpgradeClick();
                    }}
                    style={{
                      padding: '8px 16px',
                      background: '#1168bd',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
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
                      background: '#f5f5f5',
                      color: '#333',
                      border: '1px solid #ddd',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontSize: '14px',
                    }}
                  >
                    Manage
                  </button>
                )}
              </div>

              {usage.tier === 'free' && (
                <div style={{
                  padding: '12px',
                  background: '#f5f5f5',
                  borderRadius: '8px',
                  fontSize: '14px',
                }}>
                  <div style={{ color: '#666', marginBottom: '4px' }}>
                    Diagrams
                  </div>
                  <div style={{ fontWeight: 'bold', color: '#333' }}>
                    {usage.diagramCount} / {usage.diagramLimit} used
                  </div>
                </div>
              )}

              {usage.tier !== 'free' && usage.currentPeriodEnd && (
                <div style={{ fontSize: '12px', color: '#666', marginTop: '8px' }}>
                  Renews on {new Date(usage.currentPeriodEnd).toLocaleDateString()}
                </div>
              )}
            </div>
          ) : null}

          <div style={{ padding: '8px' }}>
            <button
              onClick={handleLogout}
              style={{
                width: '100%',
                padding: '12px',
                background: 'transparent',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '14px',
                color: '#d32f2f',
                fontWeight: '500',
                textAlign: 'left',
                transition: 'background 0.2s',
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = '#fee'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
            >
              Sign Out
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
