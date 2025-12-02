"use client";
import * as React from "react";

export function Command({ children, className = "" }:{ children: React.ReactNode; className?: string }){
  return <div className={["rounded-md border border-border bg-background", className].join(" ")}>{children}</div>;
}
export function CommandInput({ value, onChange, placeholder }:{ value:string; onChange:(v:string)=>void; placeholder?:string }){
  return <div className="p-2 border-b border-border"><input value={value} onChange={(e)=> onChange(e.target.value)} placeholder={placeholder} className="h-10 w-full rounded-md bg-transparent px-3 outline-none" /></div>;
}
export function CommandList({ children }:{ children: React.ReactNode }){ return <div className="max-h-[60vh] overflow-auto">{children}</div>; }
export function CommandEmpty({ children }:{ children: React.ReactNode }){ return <div className="p-3 text-sm text-muted-foreground">{children}</div>; }
export function CommandItem({ children, onSelect }:{ children: React.ReactNode; onSelect:()=>void }){ return <button className="w-full text-right px-3 py-2 text-sm hover:bg-[#101828]" onClick={onSelect}>{children}</button>; }



