import { AlertCircle, CheckCircle, Info, XCircle, X } from 'lucide-react';
import { ReactNode } from 'react';

export type AlertType = 'success' | 'error' | 'warning' | 'info';

interface AlertProps {
  type: AlertType;
  title?: string;
  children: ReactNode;
  onClose?: () => void;
  className?: string;
}

const alertStyles = {
  success: {
    container: 'bg-green-50 border-green-200 text-green-800',
    icon: CheckCircle,
    iconColor: 'text-green-400'
  },
  error: {
    container: 'bg-red-50 border-red-200 text-red-800',
    icon: XCircle,
    iconColor: 'text-red-400'
  },
  warning: {
    container: 'bg-yellow-50 border-yellow-200 text-yellow-800',
    icon: AlertCircle,
    iconColor: 'text-yellow-400'
  },
  info: {
    container: 'bg-blue-50 border-blue-200 text-blue-800',
    icon: Info,
    iconColor: 'text-blue-400'
  }
};

export function Alert({ 
  type, 
  title, 
  children, 
  onClose, 
  className = '' 
}: AlertProps) {
  const style = alertStyles[type];
  const Icon = style.icon;

  return (
    <div className={`border rounded-lg p-4 ${style.container} ${className}`}>
      <div className="flex">
        <div className="flex-shrink-0">
          <Icon className={`h-5 w-5 ${style.iconColor}`} />
        </div>
        <div className="ml-3 flex-1">
          {title && (
            <h3 className="text-sm font-medium mb-1">
              {title}
            </h3>
          )}
          <div className="text-sm">
            {children}
          </div>
        </div>
        {onClose && (
          <div className="ml-auto pl-3">
            <div className="-mx-1.5 -my-1.5">
              <button
                type="button"
                onClick={onClose}
                className={`inline-flex rounded-md p-1.5 focus:outline-none focus:ring-2 focus:ring-offset-2 hover:bg-opacity-20 hover:bg-gray-600 ${style.iconColor}`}
              >
                <span className="sr-only">Dismiss</span>
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Convenience components
export function SuccessAlert(props: Omit<AlertProps, 'type'>) {
  return <Alert type="success" {...props} />;
}

export function ErrorAlert(props: Omit<AlertProps, 'type'>) {
  return <Alert type="error" {...props} />;
}

export function WarningAlert(props: Omit<AlertProps, 'type'>) {
  return <Alert type="warning" {...props} />;
}

export function InfoAlert(props: Omit<AlertProps, 'type'>) {
  return <Alert type="info" {...props} />;
}
