import { JSX } from "react";
import { ButtonProps } from "./types";

/**
 * Button component with variants and sizes.
 *
 * @param variant - Visual variant of the button. Defaults to "primary".
 * @param size - Size of the button: "sm", "md", or "lg". Defaults to "md".
 * @param fullWidth - If true, button takes full width of its container.
 * @param loading - If true, shows a spinner and disables the button.
 * @param icon - Optional icon (ReactNode) to render before the children.
 * @param children - Button label/content.
 * @param className - Additional class names to merge.
 * @param disabled - Disabled state; also disabled when loading.
 * @param props - Other button HTML attributes (onClick, type override, etc.).
 */
const Button = ({
  variant = "primary",
  size = "md",
  fullWidth = false,
  loading = false,
  icon,
  children,
  className = "",
  disabled,
  type,
  ...props
}: ButtonProps): JSX.Element => {
  // Base classes for all buttons
  const baseClasses =
    "inline-flex items-center justify-center font-medium cursor-pointer rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900 disabled:opacity-50 disabled:cursor-not-allowed border";

  // Define styles per variant - professional, muted colors
  const variantClasses: Record<string, string> = {
    primary:
      "bg-purple-600 hover:bg-purple-700 text-white border-purple-500/50 focus:ring-purple-500 shadow-md hover:shadow-lg",
    secondary:
      "bg-slate-800/80 hover:bg-slate-700/80 text-slate-300 hover:text-slate-100 border-slate-700/50 focus:ring-slate-500 shadow-sm hover:shadow-md",
    success:
      "bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-500/50 focus:ring-emerald-500 shadow-md hover:shadow-lg",
    danger:
      "bg-slate-800 hover:bg-red-900/80 text-red-400 hover:text-red-300 border-slate-700/50 hover:border-red-800/50 focus:ring-red-500/50 shadow-md hover:shadow-lg",
    warning:
      "bg-amber-900/50 hover:bg-amber-900/70 text-amber-200 border-amber-700/30 focus:ring-amber-500/50 shadow-md hover:shadow-lg",
    ghost:
      "bg-transparent hover:bg-slate-800/60 text-slate-400 hover:text-slate-200 border-transparent hover:border-slate-700/50 focus:ring-slate-500",
    destructive:
      "bg-red-950/50 hover:bg-red-900/60 text-red-400 hover:text-red-300 border-red-900/30 focus:ring-red-500/50 shadow-md hover:shadow-lg",
  };

  // Size padding/font-size
  const sizeClasses: Record<string, string> = {
    sm: "px-3 py-2 text-sm",
    md: "px-4 py-2.5 text-sm",
    lg: "px-6 py-3 text-base",
  };

  const widthClass = fullWidth ? "w-full" : "";

  // Merge classes
  const classes = [
    baseClasses,
    variantClasses[variant] ?? variantClasses.primary,
    sizeClasses[size] ?? sizeClasses.md,
    widthClass,
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <button
      // Default to type="button" to avoid inadvertent form submits. User can override via props.type.
      type={type || "button"}
      className={classes}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        // Simple spinner + "Loading..." text; you may omit "Loading..." or customize.
        <>
          <svg
            className="animate-spin -ml-1 mr-2 h-4 w-4"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            ></circle>
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            ></path>
          </svg>
          Loading...
        </>
      ) : (
        <>
          {icon && <span className={children ? "mr-2" : ""}>{icon}</span>}
          {children}
        </>
      )}
    </button>
  );
};

export default Button;
