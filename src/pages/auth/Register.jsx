import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import useAuth from '../../hooks/useAuth';
import { registerUser } from '../../services/auth.service';
import { registerSchema } from '../../schemas/auth.schema';
import { toast } from 'react-toastify';
import AuthLayout from '../../layouts/AuthLayout';

const Register = () => {
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });

  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const result = registerSchema.safeParse(form);
    if (!result.success) {
      result.error.errors.forEach((err) => toast.error(err.message));
      return;
    }

    try {
      setLoading(true);
      const { data } = await registerUser({
        name: form.name,
        email: form.email,
        password: form.password,
      });

      login(data.user, data.token);
      toast.success('Registration successful!');
      navigate('/');
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout imageUrl="https://source.unsplash.com/featured/?startup,team">
      <h2 className="text-4xl font-extrabold text-white">Create an Account</h2>
      <p className="text-white/80">Start your journey with us today.</p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          name="name"
          placeholder="Full Name"
          value={form.name}
          onChange={handleChange}
          className="w-full px-4 py-3 rounded-xl bg-white/80 dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-600 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-400"
        />
        <input
          name="email"
          type="email"
          placeholder="Email"
          value={form.email}
          onChange={handleChange}
          className="w-full px-4 py-3 rounded-xl bg-white/80 dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-600 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-400"
        />
        <input
          name="password"
          type="password"
          placeholder="Password"
          value={form.password}
          onChange={handleChange}
          className="w-full px-4 py-3 rounded-xl bg-white/80 dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-600 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-400"
        />
        <input
          name="confirmPassword"
          type="password"
          placeholder="Confirm Password"
          value={form.confirmPassword}
          onChange={handleChange}
          className="w-full px-4 py-3 rounded-xl bg-white/80 dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-600 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-400"
        />

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 bg-gradient-to-r from-blue-500 via-purple-500 to-red-500 text-white rounded-xl font-bold shadow-lg hover:opacity-90 transition duration-300 disabled:opacity-50"
        >
          {loading ? 'Creating Account...' : 'Create Account'}
        </button>
      </form>

      <div className="text-sm text-white/80 text-center">
        Already have an account?{' '}
        <Link
          to="/login"
          className="underline text-white hover:text-purple-300"
        >
          Login
        </Link>
      </div>
    </AuthLayout>
  );
};

export default Register;
