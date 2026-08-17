import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { loginUser, googleAuth } from '../api/endpoints';
import { useAuth } from '../context/AuthContext';
import { GoogleLogin } from '@react-oauth/google';

export default function LoginPage() {
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  
  const from = location.state?.from?.pathname || '/home';

  const onSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setIsLoading(true);
    try {
      const response = await loginUser(form);
      login(response.data.token, response.data.user);
      navigate(from, { replace: true });
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Unable to login. Please check your credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSuccess = async (credentialResponse) => {
    setError('');
    try {
      const response = await googleAuth({ token: credentialResponse.credential });
      login(response.data.token, response.data.user);
      navigate(from, { replace: true });
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Google sign in failed.');
    }
  };

  const handleGoogleError = () => {
    setError('Google Sign In was unsuccessful. Try again later.');
  };

  return (
    <div className="min-h-screen flex bg-background font-sans text-text-primary">
      {/* Left Side - Branding (Hidden on mobile) */}
      <div className="hidden lg:flex lg:w-1/2 bg-primary-dark flex-col justify-between p-12 text-surface relative overflow-hidden">
        {/* Abstract shapes for visual interest */}
        <div className="absolute -top-24 -left-24 w-96 h-96 bg-primary rounded-full opacity-50 blur-3xl"></div>
        <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-primary rounded-full opacity-50 blur-3xl"></div>
        
        <div className="relative z-10">
          <div className="text-3xl font-bold flex items-center gap-3 mb-16">
            <span className="text-4xl">🍊</span> OrangeFair
          </div>
          
          <h1 className="text-5xl font-bold leading-tight mb-6">
            Fair rides,<br />transparent community.
          </h1>
          <p className="text-lg text-surface/80 max-w-md">
            Join the community-driven platform bringing transparency and fairness to auto-rickshaw travel in Nagpur.
          </p>
        </div>
        
        <div className="relative z-10">
          <p className="text-sm font-medium text-surface/60">Built for Nagpur Citizens</p>
        </div>
      </div>

      {/* Right Side - Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center lg:text-left">
            <div className="lg:hidden text-3xl font-bold flex items-center justify-center gap-2 mb-8 text-primary">
              <span className="text-3xl">🍊</span> OrangeFair
            </div>
            <h2 className="text-3xl font-bold tracking-tight text-text-primary">Welcome back</h2>
            <p className="mt-2 text-sm text-text-secondary">Please enter your details to sign in.</p>
          </div>

          <form onSubmit={onSubmit} className="space-y-6 mt-8">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-text-primary mb-1">Email</label>
                <input
                  type="email"
                  required
                  placeholder="Enter your email"
                  className="w-full rounded-lg border border-border bg-surface px-4 py-2.5 text-text-primary focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-all"
                  onChange={(event) => setForm((prev) => ({ ...prev, email: event.target.value }))}
                />
              </div>
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-sm font-medium text-text-primary">Password</label>
                  <a href="#" className="text-sm text-primary hover:text-primary-dark font-medium transition-colors">Forgot password?</a>
                </div>
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  className="w-full rounded-lg border border-border bg-surface px-4 py-2.5 text-text-primary focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-all"
                  onChange={(event) => setForm((prev) => ({ ...prev, password: event.target.value }))}
                />
              </div>
            </div>

            {error && (
              <div className="p-3 bg-error/10 border border-error/20 rounded-lg">
                <p className="text-sm text-error font-medium text-center">{error}</p>
              </div>
            )}

            <button 
              type="submit" 
              disabled={isLoading}
              className="w-full rounded-lg bg-primary hover:bg-primary-dark px-4 py-2.5 font-medium text-surface transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>
          
          <div className="relative my-8">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="bg-background px-4 text-text-secondary">Or continue with</span>
            </div>
          </div>

          <div className="flex justify-center">
            <GoogleLogin
              onSuccess={handleGoogleSuccess}
              onError={handleGoogleError}
              useOneTap
              shape="rectangular"
              size="large"
              width="100%"
            />
          </div>

          <p className="text-center text-sm text-text-secondary mt-8">
            Don't have an account?{' '}
            <Link to="/register" className="font-medium text-primary hover:text-primary-dark transition-colors">
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
