import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { registerUser, googleAuth } from '../api/endpoints';
import { useAuth } from '../context/AuthContext';
import { GoogleLogin } from '@react-oauth/google';

export default function RegisterPage() {
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { login } = useAuth();

  const onSubmit = async (event) => {
    event.preventDefault();
    setError('');
    try {
      const response = await registerUser(form);
      login(response.data.token, response.data.user);
      navigate('/dashboard');
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Unable to register.');
    }
  };

  const handleGoogleSuccess = async (credentialResponse) => {
    setError('');
    try {
      const response = await googleAuth({ token: credentialResponse.credential });
      login(response.data.token, response.data.user);
      navigate('/dashboard');
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Google sign in failed.');
    }
  };

  const handleGoogleError = () => {
    setError('Google Sign In was unsuccessful. Try again later');
  };

  return (
    <div className="mx-auto max-w-md px-6 py-10">
      <h1 className="text-3xl font-bold">Register</h1>
      <form onSubmit={onSubmit} className="mt-6 space-y-4">
        <input
          required
          placeholder="Full name"
          className="w-full rounded-md border border-primary/30 px-4 py-3"
          onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
        />
        <input
          type="email"
          required
          placeholder="Email"
          className="w-full rounded-md border border-primary/30 px-4 py-3"
          onChange={(event) => setForm((prev) => ({ ...prev, email: event.target.value }))}
        />
        <input
          type="password"
          required
          placeholder="Password"
          className="w-full rounded-md border border-primary/30 px-4 py-3"
          onChange={(event) => setForm((prev) => ({ ...prev, password: event.target.value }))}
        />
        {error ? <p className="text-sm text-red-600">{error}</p> : null}
        <button type="submit" className="w-full rounded-md bg-primary px-4 py-3 font-medium text-surface">
          Create account
        </button>
      </form>
      
      <div className="mt-6">
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-dark/20"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="bg-surface px-2 text-dark/60">Or continue with</span>
          </div>
        </div>

        <div className="mt-6 flex justify-center">
          <GoogleLogin
            onSuccess={handleGoogleSuccess}
            onError={handleGoogleError}
            useOneTap
          />
        </div>
      </div>

      <p className="mt-4 text-sm text-dark/70">
        Already registered?{' '}
        <Link to="/login" className="font-medium text-primary">
          Login
        </Link>
      </p>
    </div>
  );
}
