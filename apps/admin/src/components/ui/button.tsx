"use client";
import * as React from "react";

type Variant = "default" | "secondary" | "ghost" | "destructive";
type Size = "sm" | "md" | "lg";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
}

export function Button({
  className = "",
  variant = "default",
  size = "md",
  ...props
}: ButtonProps) {
  const base = "inline-flex items-center justify-center font-medium rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50 disabled:pointer-events-none transition-colors";
  const variantCls: Record<Variant, string> = {
    default: "bg-primary text-white hover:brightness-95",
    secondary: "bg-muted text-foreground hover:bg-[#0e1524]",
    ghost: "bg-transparent text-foreground hover:bg-[#101828]",
    destructive: "bg-destructive text-white hover:brightness-95",
  };
  const sizeCls: Record<Size, string> = {
    sm: "h-9 px-3 text-sm",
    md: "h-11 px-4 text-sm",
    lg: "h-12 px-6 text-base",
  };
  return (
    <button className={[base, variantCls[variant], sizeCls[size], className].join(" ")} {...props} />
  );
}



