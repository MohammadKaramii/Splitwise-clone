import { ButtonHTMLAttributes, forwardRef } from "react";
import styles from "../../styles/components/Button.module.css";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "success" | "error" | "ghost";
  size?: "small" | "default" | "large" | "xlarge";
  fullWidth?: boolean;
  loading?: boolean;
  icon?: boolean;
  children: React.ReactNode;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = "primary",
      size = "default",
      fullWidth = false,
      loading = false,
      icon = false,
      className = "",
      disabled,
      children,
      ...props
    },
    ref
  ) => {
    const classNames = [
      styles.button,
      styles[variant],
      size !== "default" && styles[size],
      fullWidth && styles.fullWidth,
      icon && styles.icon,
      loading && styles.loading,
      className,
    ]
      .filter(Boolean)
      .join(" ");

    return (
      <button
        ref={ref}
        className={classNames}
        disabled={disabled || loading}
        {...props}
      >
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";
