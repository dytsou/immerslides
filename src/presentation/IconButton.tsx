import type { ReactNode } from 'react';

type IconButtonProps = {
  label: string;
  children: ReactNode;
  onClick: () => void;
  disabled?: boolean;
  secondary?: boolean;
};

export function IconButton({
  label,
  children,
  onClick,
  disabled,
  secondary = false,
}: IconButtonProps) {
  return (
    <button
      type="button"
      className="icon-button"
      data-secondary={secondary || undefined}
      aria-label={label}
      title={label}
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </button>
  );
}
