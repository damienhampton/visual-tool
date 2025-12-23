import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';

interface AuthModalProps {
  onClose: () => void;
}

export function AuthModal({ onClose }: AuthModalProps) {
  const [mode, setMode] = useState<'login' | 'register' | 'guest'>('login');
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const { login, register, loginAsGuest } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      if (mode === 'login') {
        await login(email, password);
      } else if (mode === 'register') {
        await register(email, name, password);
      } else if (mode === 'guest') {
        await loginAsGuest(name);
      }
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.message || 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[1000]">
      <div className="bg-white rounded-lg p-8 w-[400px] max-w-[90%] relative">
        <h2 className="m-0 mb-6 text-2xl font-bold text-gray-800">
          {mode === 'login' ? 'Login' : mode === 'register' ? 'Register' : 'Continue as Guest'}
        </h2>

        <form onSubmit={handleSubmit}>
          {mode !== 'login' && (
            <div className="mb-4">
              <label className="block mb-2 text-sm font-medium text-gray-700">
                Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              />
            </div>
          )}

          {mode !== 'guest' && (
            <>
              <div className="mb-4">
                <label className="block mb-2 text-sm font-medium text-gray-700">
                  Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                />
              </div>

              <div className="mb-4">
                <label className="block mb-2 text-sm font-medium text-gray-700">
                  Password
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                />
              </div>
            </>
          )}

          {error && (
            <div className="p-3 bg-red-50 text-red-700 rounded mb-4 text-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 bg-blue-600 text-white rounded text-base font-semibold hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
          >
            {isLoading ? 'Loading...' : mode === 'login' ? 'Login' : mode === 'register' ? 'Register' : 'Continue'}
          </button>
        </form>

        <div className="mt-4 text-center text-sm text-gray-600">
          {mode === 'login' ? (
            <>
              Don't have an account?{' '}
              <button
                onClick={() => setMode('register')}
                className="bg-transparent border-none text-blue-600 cursor-pointer underline hover:text-blue-700"
              >
                Register
              </button>
              {' or '}
              <button
                onClick={() => setMode('guest')}
                className="bg-transparent border-none text-blue-600 cursor-pointer underline hover:text-blue-700"
              >
                Continue as Guest
              </button>
            </>
          ) : mode === 'register' ? (
            <>
              Already have an account?{' '}
              <button
                onClick={() => setMode('login')}
                className="bg-transparent border-none text-blue-600 cursor-pointer underline hover:text-blue-700"
              >
                Login
              </button>
            </>
          ) : (
            <>
              Have an account?{' '}
              <button
                onClick={() => setMode('login')}
                className="bg-transparent border-none text-blue-600 cursor-pointer underline hover:text-blue-700"
              >
                Login
              </button>
            </>
          )}
        </div>

        <button
          onClick={onClose}
          className="absolute top-4 right-4 bg-transparent border-none text-2xl cursor-pointer text-gray-400 hover:text-gray-600"
        >
          ×
        </button>
      </div>
    </div>
  );
}
