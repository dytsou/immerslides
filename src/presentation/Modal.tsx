import { X } from 'lucide-react';
import { type ReactNode, useLayoutEffect, useRef } from 'react';
import { IconButton } from './IconButton.js';

type ModalProps = {
  title: string;
  children: ReactNode;
  onClose: () => void;
  className?: string;
};

export function Modal({
  title,
  children,
  onClose,
  className = '',
}: ModalProps) {
  const ref = useRef<HTMLDialogElement>(null);
  useLayoutEffect(() => {
    const dialog = ref.current!;
    dialog.showModal();
    return () => dialog.close();
  }, []);
  return (
    <dialog
      ref={ref}
      aria-label={title}
      className={`presentation-modal modal ${className}`}
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <header>
        <h2>{title}</h2>
        <IconButton label="關閉" onClick={onClose}>
          <X size={23} />
        </IconButton>
      </header>
      {children}
    </dialog>
  );
}
