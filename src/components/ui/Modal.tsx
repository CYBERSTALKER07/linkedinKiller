import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

// Simple cn utility function to combine class names
const cn = (...classes: (string | undefined | null | false)[]): string => {
  return classes.filter(Boolean).join(' ');
};

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  size?: 'small' | 'medium' | 'large' | 'extra-large' | 'full-screen';
  className?: string;
  closeOnOverlayClick?: boolean;
  showCloseButton?: boolean;
  variant?: 'standard' | 'full-screen-dialog';
  actions?: React.ReactNode;
}

export default function Modal({
  isOpen,
  onClose,
  title,
  children,
  size = 'medium',
  className = '',
  closeOnOverlayClick = true,
  showCloseButton = true,
  variant = 'standard',
  actions,
}: ModalProps) {
  const { isDark } = useTheme();

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const sizeClasses = {
    small: 'max-w-sm',
    medium: 'max-w-md',
    large: 'max-w-2xl',
    'extra-large': 'max-w-4xl',
    'full-screen': 'max-w-full mx-4 h-[90vh]'
  };

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget && closeOnOverlayClick) {
      onClose();
    }
  };

  if (variant === 'full-screen-dialog') {
    return (
      <div className="fixed inset-0 z-50 overflow-y-auto">
        <div className={`min-h-full ${isDark ? 'bg-dark-surface' : 'bg-white'
          } transition-all duration-300 ease-material-emphasized`}>
          {/* Header */}
          <div className={`flex items-center justify-between p-6 border-b ${isDark ? 'border-gray-600' : 'border-gray-200'
            }`}>
            <button
              onClick={onClose}
              className={`p-2 rounded-full transition-colors duration-200 ${isDark
                  ? 'text-dark-muted hover:text-dark-text hover:bg-gray-700'
                  : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'
                }`}
            >
              <X className="h-6 w-6" />
            </button>
            {title && (
              <h1 className={`text-title-large font-medium ${isDark ? 'text-dark-text' : 'text-gray-900'
                }`}>
                {title}
              </h1>
            )}
            <div className="w-10" /> {/* Spacer */}
          </div>

          {/* Content */}
          <div className="p-6 overflow-y-auto">
            {children}
          </div>

          {/* Actions */}
          {actions && (
            <div className={`p-6 border-t ${isDark ? 'border-gray-600' : 'border-gray-200'
              }`}>
              {actions}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div
        className="flex min-h-full items-center justify-center p-4 text-center"
        onClick={handleOverlayClick}
      >
        {/* Scrim */}
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity duration-300 ease-material-standard" />

        {/* Modal Container */}
        <div
          className={cn(
            'relative transform overflow-hidden rounded-3xl shadow-elevation-3 transition-all duration-300 ease-material-emphasized w-full',
            isDark ? 'bg-dark-surface' : 'bg-surface-50',
            sizeClasses[size],
            className
          )}
        >
          {/* Header */}
          {(title || showCloseButton) && (
            <div className={`relative flex items-center justify-center p-6 ${actions ? `border-b ${isDark ? 'border-gray-600' : 'border-gray-200'}` : ''
              }`}>
              {title && (
                <h2 className={`text-headline-small font-normal text-center ${isDark ? 'text-dark-text' : 'text-gray-900'
                  }`}>
                  {title}
                </h2>
              )}
              {showCloseButton && (
                <button
                  onClick={onClose}
                  className={`absolute right-6 top-6 p-2 rounded-full transition-colors duration-200 ${isDark
                      ? 'text-dark-muted hover:text-dark-text hover:bg-gray-700'
                      : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'
                    }`}
                >
                  <X className="h-5 w-5" />
                </button>
              )}
            </div>
          )}

          {/* Content */}
          <div className="p-6">
            {children}
          </div>

          {/* Actions */}
          {actions && (
            <div className={`flex items-center justify-end gap-3 p-6 border-t ${isDark ? 'border-gray-600' : 'border-gray-200'
              }`}>
              {actions}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Material Design 3 Modal Variants
export const MaterialModal = {
  Dialog: (props: Omit<ModalProps, 'variant'>) =>
    <Modal variant="standard" {...props} />,

  FullScreen: (props: Omit<ModalProps, 'variant'>) =>
    <Modal variant="full-screen-dialog" {...props} />,

  Alert: (props: Omit<ModalProps, 'size' | 'closeOnOverlayClick'>) =>
    <Modal size="small" closeOnOverlayClick={false} {...props} />,
};