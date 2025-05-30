import AppRouter from './routes/AppRouter';
import { AuthProvider } from './context/AuthContext';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { NotificationProvider } from './context/NotificationContext';

function App() {
  return (
    <AuthProvider>
      <NotificationProvider>
        <AppRouter />
        <ToastContainer position="top-right" autoClose={3000} />
      </NotificationProvider>
    </AuthProvider>
  );
}

export default App;
