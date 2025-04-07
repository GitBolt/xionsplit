import React from 'react';
import { motion, HTMLMotionProps } from 'framer-motion';

interface ButtonProps extends Omit<HTMLMotionProps<"button">, "whileTap" | "whileHover"> {
  variant?: 'primary' | 'secondary' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  icon?: React.ReactNode;
}

const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  icon,
  className = '',
  ...props
}) => {
  const baseStyles = "rounded-full font-medium transition-all duration-300 flex items-center justify-center gap-2";
  
  const variantStyles = {
    primary: "bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-md hover:shadow-lg",
    secondary: "bg-zinc-100 hover:bg-zinc-200 text-zinc-800 dark:bg-zinc-800 dark:hover:bg-zinc-700 dark:text-zinc-200",
    outline: "border border-zinc-300 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800"
  };
  
  const sizeStyles = {
    sm: "text-xs py-1.5 px-3",
    md: "text-sm py-2 px-4",
    lg: "text-base py-2.5 px-5"
  };
  
  const disabledStyles = props.disabled 
    ? "opacity-50 cursor-not-allowed" 
    : "cursor-pointer";

  return (
    <motion.button
      className={`${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${disabledStyles} ${className}`}
      whileTap={{ scale: props.disabled ? 1 : 0.97 }}
      whileHover={props.disabled ? {} : { 
        boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)"
      }}
      {...props}
    >
      {isLoading ? (
        <>
          <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <span>{typeof children === 'string' ? children : 'Loading...'}</span>
        </>
      ) : (
        <>
          {icon}
          {children}
        </>
      )}
    </motion.button>
  );
};

export default Button; 