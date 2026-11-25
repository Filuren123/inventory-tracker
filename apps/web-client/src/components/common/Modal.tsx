import { useEffect, useId, useRef, type ReactNode } from 'react';
import './Modal.css';

interface Props {
    title: string;
    onClose: () => void;
    children: ReactNode;
    /** Extra buttons in the header, next to Close. */
    actions?: ReactNode;
}

/**
 * Native <dialog>: focus trapping, Esc to close and the backdrop come from the browser.
 * Full screen on phones, centred panel on wider screens.
 */
const Modal = ({ title, onClose, children, actions }: Props) => {
    const ref = useRef<HTMLDialogElement>(null);
    const titleId = useId();

    useEffect(() => {
        const dialog = ref.current;
        if (!dialog) return;
        dialog.showModal();
        document.body.classList.add('modal-open');
        return () => {
            document.body.classList.remove('modal-open');
            if (dialog.open) dialog.close();
        };
    }, []);

    return (
        <dialog
            ref={ref}
            className="modal"
            aria-labelledby={titleId}
            onCancel={(e) => {
                e.preventDefault(); // let React unmount us instead of the browser closing it
                onClose();
            }}
            onClick={(e) => {
                if (e.target === ref.current) onClose(); // click on the backdrop
            }}
        >
            <div className="modal-inner">
                <header className="modal-header">
                    <h2 id={titleId}>{title}</h2>
                    <div className="modal-actions">
                        {actions}
                        <button type="button" className="btn btn-ghost btn-sm" onClick={onClose} aria-label="Close">
                            ✕
                        </button>
                    </div>
                </header>
                <div className="modal-body">{children}</div>
            </div>
        </dialog>
    );
};

export default Modal;
