import React from "react";
import { JSX } from "react";
import { ButtonProps } from "./types";

const Button = ({
  variant = "primary",
  size = "md",
  fullWidth = false,
  loading = false,
  icon,
  children,
  className = "",
  disabled,
  ...props
}: ButtonProps): JSX.Element => {
  const baseClasses =
    "inline-flex items-center justify-center font-medium cursor-pointer rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900 disabled:opacity-50 disabled:cursor-not-allowed backdrop-blur-sm border";

  const variantClasses = {
    primary:
      "bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white border-blue-500/50 focus:ring-blue-500 shadow-lg hover:shadow-xl",
    secondary:
      "bg-slate-800/80 hover:bg-slate-700/80 text-slate-200 hover:text-white border-slate-700/50 focus:ring-slate-500 shadow-md hover:shadow-lg",
    success:
      "bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white border-emerald-500/50 focus:ring-emerald-500 shadow-lg hover:shadow-xl",
    danger:
      "bg-gradient-to-r from-red-600 to-red-600 hover:from-red-700 hover:to-red-700 text-white border-red-500/50 focus:ring-red-500 shadow-lg hover:shadow-xl",
    warning:
      "bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white border-amber-500/50 focus:ring-amber-500 shadow-lg hover:shadow-xl",
    ghost:
      "bg-transparent hover:bg-slate-800/60 text-slate-300 hover:text-white border-slate-600/50 hover:border-slate-500/50 focus:ring-slate-500",
  };

  const sizeClasses = {
    sm: "px-3 py-2 text-sm",
    md: "px-4 py-2.5 text-sm",
    lg: "px-6 py-3 text-base",
  };

  const widthClass = fullWidth ? "w-full" : "";

  const classes = `
    ${baseClasses}
    ${variantClasses[variant]}
    ${sizeClasses[size]}
    ${widthClass}
    ${className}
  `.trim();

  return (
    <button className={classes} disabled={disabled || loading} {...props}>
      {loading ? (
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
