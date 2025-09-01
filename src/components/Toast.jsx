import React from 'react';
import { X, CheckCircle, AlertCircle, AlertTriangle, Info } from 'lucide-react';
import { useToast } from '../hooks/useToast';

const Toast = ({ toast }) => {
  const { removeToast } = useToast();

  const getToastStyles = (type) => {
    switch (type) {
      case 'success':
        return 'bg-green-50 border-green-200 text-green-800';
      case 'error':
        return 'bg-red-50 border-red-200 text-red-800';
      case 'warning':
        return 'bg-yellow-50 border-yellow-200 text-yellow-800';
      default:
        return 'bg-blue-50 border-blue-200 text-blue-800';
    }
  };

  const getIcon = (type) => {
    switch (type) {
      case 'success':
        return <CheckCircle className="h-5 w-5 text-green-400" />;
      case 'error':
        return <AlertCircle className="h-5 w-5 text-red-400" />;
      case 'warning':
        return <AlertTriangle className="h-5 w-5 text-yellow-400" />;
      default:
        return <Info className="h-5 w-5 text-blue-400" />;
    }
  };

  return (
    <div className={`flex items-center p-4 mb-4 rounded-md border ${getToastStyles(toast.type)} transition-all duration-300`}>
      <div className="flex-shrink-0">
        {getIcon(toast.type)}
      </div>
      <div className="ml-3 flex-1">
        <p className="text-sm font-medium">{toast.message}</p>
      </div>
      <div className="ml-auto pl-3">
        <button
          onClick={() => removeToast(toast.id)}
          className="inline-flex rounded-md p-1.5 text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-600 focus:ring-offset-2"
        >
          <X className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
};

export default Toast;
