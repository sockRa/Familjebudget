import { useEffect, useRef } from 'react';

interface ConfirmDialogProps {
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    onCancel: () => void;
    variant?: 'danger' | 'warning' | 'info';
    confirmText?: string;
    cancelText?: string;
}

export function ConfirmDialog({
    isOpen,
    title,
    message,
    onConfirm,
    onCancel,
    variant = 'danger',
    confirmText = 'Ta bort',
    cancelText = 'Avbryt',
}: ConfirmDialogProps) {
    const dialogRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (isOpen) {
            // Focus the dialog when opened
            dialogRef.current?.focus();

            // Handle escape key
            const handleEscape = (e: KeyboardEvent) => {
                if (e.key === 'Escape') {
                    onCancel();
                }
            };
            document.addEventListener('keydown', handleEscape);
            return () => document.removeEventListener('keydown', handleEscape);
        }
    }, [isOpen, onCancel]);

    if (!isOpen) return null;

    const variantStyles = {
        danger: {
            icon: '⚠️',
            buttonClass: 'btn-confirm-danger',
        },
        warning: {
            icon: '⚡',
            buttonClass: 'btn-confirm-warning',
        },
        info: {
            icon: 'ℹ️',
            buttonClass: 'btn-confirm-info',
        },
    };

    const { icon, buttonClass } = variantStyles[variant];

    return (
        <div className="confirm-backdrop" onClick={onCancel}>
            <div
                className="confirm-dialog"
                onClick={e => e.stopPropagation()}
                ref={dialogRef}
                tabIndex={-1}
            >
                <div className="confirm-icon">{icon}</div>
                <h3 className="confirm-title">{title}</h3>
                <p className="confirm-message">{message}</p>
                <div className="confirm-actions">
                    <button className="btn btn-secondary" onClick={onCancel}>
                        {cancelText}
                    </button>
                    <button className={`btn ${buttonClass}`} onClick={onConfirm}>
                        {confirmText}
                    </button>
                </div>
            </div>
        </div>
    );
}
