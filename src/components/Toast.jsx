import { useEffect } from 'react';
import { MdCheckCircle, MdError, MdWarning, MdInfo, MdClose } from 'react-icons/md';

const Toast = ({ message, type = 'info', onClose, duration = 3000 }) => {
  useEffect(() => {
    if (duration) {
      const timer = setTimeout(onClose, duration);
      return () => clearTimeout(timer);
    }
  }, [duration, onClose]);

  const icons = {
    success: <MdCheckCircle className="text-2xl" />,
    error: <MdError className="text-2xl" />,
    warning: <MdWarning className="text-2xl" />,
    info: <MdInfo className="text-2xl" />,
  };

  const colors = {
    success: 'bg-green-600 border-green-500',
    error: 'bg-red-600 border-red-500',
    warning: 'bg-yellow-600 border-yellow-500',
    info: 'bg-blue-600 border-blue-500',
  };

  return (
    <div className={`${colors[type]} border-l-4 rounded-lg shadow-lg p-4 flex items-center gap-3 min-w-[300px] max-w-md animate-slideIn`}>
      <div className="text-white">{icons[type]}</div>
      <p className="flex-1 text-white text-sm font-medium">{message}</p>
      <button
        onClick={onClose}
        className="text-white hover:text-gray-200 transition-colors"
      >
        <MdClose />
      </button>
    </div>
  );
};

export default Toast;
