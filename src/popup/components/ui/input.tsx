import * as React from "react";
import { cn } from "../../lib/utils";
import { theme } from "../../them";

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  variant?: "static" | "standard" | "outlined";
  label?: string;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, variant = "standard", label, ...props }, ref) => {
    const inputStyles = {
      static: "border-b-2 border-primary/50 focus:border-primary",
      standard: `border-b-2 border-cyber-border focus:border-primary
        placeholder:text-transparent
        focus:placeholder:text-cyber-text-secondary`,
      outlined: "border-2 border-cyber-border focus:border-primary",
    };

    return (
      <div className="relative w-full min-w-[200px] h-14">
        <input
          type={type}
          className={cn(
            "peer w-full h-full bg-transparent text-cyber-text-primary font-sans font-normal outline outline-0 focus:outline-0 disabled:bg-cyber-bg-lighter/50 disabled:border-0 transition-all",
            "placeholder-shown:border-cyber-border",
            "focus:border-primary",
            "px-0 pt-4 mb-1",
            inputStyles[variant],
            className
          )}
          placeholder=" "
          ref={ref}
          {...props}
        />
        {label && (
          <label
            className={cn(
              "flex w-full h-full select-none pointer-events-none absolute left-0 font-normal",
              "peer-placeholder-shown:text-cyber-text-secondary peer-focus:text-primary",
              "leading-tight peer-focus:leading-tight",
              "peer-placeholder-shown:text-[16px] text-[12px] peer-focus:text-[12px]",
              "before:content[' '] before:block before:box-border before:w-2.5 before:h-1.5 before:mt-[6.5px] before:mr-1 before:rounded-tl-md before:pointer-events-none",
              "after:content[' '] after:block after:flex-grow after:box-border after:w-2.5 after:h-1.5 after:mt-[6.5px] after:ml-1 after:rounded-tr-md after:pointer-events-none",
              "transition-all",
              variant === "standard" && [
                "text-cyan-400",
                "peer-placeholder-shown:leading-[4.25] peer-focus:leading-tight",
                "peer-placeholder-shown:top-0 top-0",
              ],
              variant === "static" && [
                "text-cyan-400",
                "peer-placeholder-shown:leading-[4.25] peer-focus:leading-tight",
                "peer-placeholder-shown:top-0 top-0",
              ],
              variant === "outlined" && [
                "text-cyan-400",
                "peer-placeholder-shown:leading-[3.75] peer-focus:leading-tight",
                "peer-placeholder-shown:top-2.5 top-0",
              ]
            )}
          >
            {label}
          </label>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";

export { Input };
