import { useEffect, useRef, useState } from 'react';

interface ConfirmDialogProps {
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void | Promise<void>;
    onCancel: () => void;
    variant?: 'danger' | 'warning' | 'info';
    confirmText?: string;
    cancelText?: string;
    // Optional secondary action
    secondaryConfirmText?: string;
    onSecondaryConfirm?: () => void | Promise<void>;
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
    secondaryConfirmText,
    onSecondaryConfirm,
}: ConfirmDialogProps) {
    const dialogRef = useRef<HTMLDivElement>(null);
    const [loadingButton, setLoadingButton] = useState<'confirm' | 'secondary' | null>(null);
    const isMounted = useRef(true);

    useEffect(() => {
        isMounted.current = true;
        return () => { isMounted.current = false; };
    }, []);

    useEffect(() => {
        if (isOpen) {
            // Reset loading state when dialog opens
            setLoadingButton(null);

            // Focus the dialog when opened
            dialogRef.current?.focus();
        }
    }, [isOpen]);

    useEffect(() => {
        if (isOpen) {
            // Handle escape key
            const handleEscape = (e: KeyboardEvent) => {
                if (e.key === 'Escape' && !loadingButton) {
                    onCancel();
                }
            };
            document.addEventListener('keydown', handleEscape);
            return () => document.removeEventListener('keydown', handleEscape);
        }
    }, [isOpen, onCancel, loadingButton]);

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

    const handleConfirm = async () => {
        if (loadingButton) return;
        setLoadingButton('confirm');
        try {
            await onConfirm();
        } finally {
            if (isMounted.current) setLoadingButton(null);
        }
    };

    const handleSecondaryConfirm = async () => {
        if (loadingButton) return;
        setLoadingButton('secondary');
        try {
            if (onSecondaryConfirm) await onSecondaryConfirm();
        } finally {
            if (isMounted.current) setLoadingButton(null);
        }
    };

    const Spinner = ({ color = 'white' }: { color?: string }) => (
        <div className="loading-spinner" style={{
            width: '1em',
            height: '1em',
            borderWidth: '2px',
            marginBottom: 0,
            borderColor: color,
            borderTopColor: 'transparent',
            display: 'inline-block'
        }} />
    );

    return (
        <div className="confirm-backdrop" onClick={!loadingButton ? onCancel : undefined}>
            <div
                className="confirm-dialog"
                onClick={e => e.stopPropagation()}
                ref={dialogRef}
                tabIndex={-1}
            >
                <div className="confirm-icon">{icon}</div>
                <h3 className="confirm-title">{title}</h3>
                <p className="confirm-message">{message}</p>
                <div className="confirm-actions" style={{ flexWrap: 'wrap', gap: 'var(--space-sm)' }}>
                    <button
                        className="btn btn-secondary"
                        onClick={onCancel}
                        disabled={!!loadingButton}
                    >
                        {cancelText}
                    </button>
                    {secondaryConfirmText && onSecondaryConfirm && (
                        <button
                            className="btn btn-secondary"
                            onClick={handleSecondaryConfirm}
                            disabled={!!loadingButton}
                        >
                            {loadingButton === 'secondary' ? <Spinner color="var(--color-text)" /> : secondaryConfirmText}
                        </button>
                    )}
                    <button
                        className={`btn ${buttonClass}`}
                        onClick={handleConfirm}
                        disabled={!!loadingButton}
                        style={{ minWidth: '100px' }} // Ensure min-width prevents layout shift
                    >
                        {loadingButton === 'confirm' ? <Spinner /> : confirmText}
                    </button>
                </div>
            </div>
        </div>
    );
}
