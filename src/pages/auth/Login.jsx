import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { loginUser } from '../../services/auth.service';
import useAuth from '../../hooks/useAuth';
import { loginSchema } from '../../schemas/auth.schema';
import { toast } from 'react-toastify';
import AuthLayout from '../../layouts/AuthLayout';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();
  const { login } = useAuth();

  const handleLogin = async (e) => {
    e.preventDefault();
    const result = loginSchema.safeParse({ email, password });

    if (!result.success) {
      result.error.errors.forEach((err) => toast.error(err.message));
      return;
    }
    setLoading(true);
    try {
      const { data } = await loginUser({ email, password });
      login(data.user, data.token);
      toast.success('Login successful!');
      navigate('/');
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout imageUrl="https://source.unsplash.com/featured/?technology,code">
      <h2 className="text-4xl font-extrabold text-white">Welcome Back 👋</h2>
      <p className="text-white/80">Please enter your credentials to sign in.</p>

      <form onSubmit={handleLogin} className="space-y-4">
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full px-4 py-3 rounded-xl bg-white/80 dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-600 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-400"
        />

        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full px-4 py-3 rounded-xl bg-white/80 dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-600 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-400"
          required
        />

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 bg-gradient-to-r from-blue-500 via-purple-500 to-red-500 text-white rounded-xl font-bold shadow-lg hover:opacity-90 transition duration-300"
        >
          {loading ? 'Signing In...' : 'Sign In'}
        </button>
      </form>

      <div className="text-sm text-white/80 text-center">
        Don&apos;t have an account?{' '}
        <Link
          to="/register"
          className="underline text-white hover:text-purple-300"
        >
          Register here
        </Link>
      </div>
    </AuthLayout>
  );
};

export default Login;
