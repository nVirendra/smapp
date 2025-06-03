import { useContext } from 'react';
import { FiBell } from 'react-icons/fi';
import { NotificationContext } from '../../context/NotificationContext';

export default function NotificationBell() {
  const { notifications } = useContext(NotificationContext);
  const unread = notifications.filter((n) => !n.read).length;

  return (
    <div className="relative">
      <FiBell className="w-6 h-6 text-gray-800 dark:text-white" />
      {unread > 0 && (
        <span className="absolute -top-1 -right-1 text-xs w-5 h-5 bg-red-600 text-white rounded-full flex items-center justify-center">
          {unread}
        </span>
      )}
    </div>
  );
}
