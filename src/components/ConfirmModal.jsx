import { MdWarning, MdCheckCircle, MdError, MdInfo, MdClose } from 'react-icons/md';

const ConfirmModal = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title, 
  message, 
  type = 'warning', // 'warning', 'danger', 'success', 'info'
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  loading = false
}) => {
  if (!isOpen) return null;

  const icons = {
    warning: <MdWarning className="text-5xl text-yellow-400" />,
    danger: <MdError className="text-5xl text-red-400" />,
    success: <MdCheckCircle className="text-5xl text-green-400" />,
    info: <MdInfo className="text-5xl text-blue-400" />,
  };

  const confirmColors = {
    warning: 'bg-yellow-600 hover:bg-yellow-700',
    danger: 'bg-red-600 hover:bg-red-700',
    success: 'bg-green-600 hover:bg-green-700',
    info: 'bg-blue-600 hover:bg-blue-700',
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[9999] p-4 animate-fadeIn">
      <div className="bg-gray-800 border border-gray-700 rounded-2xl max-w-md w-full p-6 shadow-2xl animate-slideIn">
        <div className="flex flex-col items-center text-center">
          <div className="mb-4">
            {icons[type]}
          </div>
          
          <h3 className="text-xl font-bold text-white mb-2">
            {title}
          </h3>
          
          <p className="text-gray-400 mb-6">
            {message}
          </p>

          <div className="flex gap-3 w-full">
            <button
              onClick={onClose}
              disabled={loading}
              className="flex-1 px-4 py-2.5 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
            >
              {cancelText}
            </button>
            <button
              onClick={onConfirm}
              disabled={loading}
              className={`flex-1 px-4 py-2.5 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium ${confirmColors[type]}`}
            >
              {loading ? 'Processing...' : confirmText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConfirmModal;
