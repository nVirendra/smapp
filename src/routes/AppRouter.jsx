import { BrowserRouter, Routes, Route } from 'react-router-dom';

import Home from '../pages/feed/Home';
import Login from '../pages/auth/Login';
import Register from '../pages/auth/Register';
import ProtectedRoute from '../components/ProtectedRoute';
import Logout from '../pages/auth/Logout';
import UserProfile from '../pages/profile/[userId]';
import LiveStreams from '../pages/stream/LiveStreams';
import LiveStreamCamera from '../pages/stream/LiveStreamCamera';
import WatchPage from '../pages/stream/[streamKey]';
const AppRouter = () => {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public Routes */}
        <Route path="/register" element={<Register />} />
        <Route path="/login" element={<Login />} />
        <Route path="/logout" element={<Logout />} />

        {/* Protected Routes */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Home />
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile/:userId"
          element={
            <ProtectedRoute>
              <UserProfile />
            </ProtectedRoute>
          }
        />

        <Route
          path="/go-live"
          element={
            <ProtectedRoute>
              <LiveStreamCamera />
            </ProtectedRoute>
          }
        />

        <Route
          path="/live-streams"
          element={
            <ProtectedRoute>
              <LiveStreams />
            </ProtectedRoute>
          }
        />

        <Route
          path="/watch/:streamKey"
          element={
            <ProtectedRoute>
              <WatchPage />
            </ProtectedRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  );
};

export default AppRouter;
