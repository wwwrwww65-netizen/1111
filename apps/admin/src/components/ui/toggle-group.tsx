"use client";
import * as React from "react";

type Value = string;

export function ToggleGroup({
  value,
  onChange,
  options,
  className = "",
}: {
  value: Value;
  onChange: (v: Value) => void;
  options: { value: Value; label: React.ReactNode }[];
  className?: string;
}) {
  return (
    <div className={["inline-flex overflow-hidden rounded-md border border-border", className].join(" ")}> 
      {options.map((opt)=> (
        <button
          key={opt.value}
          className={[
            "px-3 h-9 text-xs",
            value===opt.value? "bg-primary text-white" : "bg-background text-foreground",
          ].join(" ")}
          onClick={()=> onChange(opt.value)}
          type="button"
        >{opt.label}</button>
      ))}
    </div>
  );
}



