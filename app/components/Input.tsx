"use client";
import React from "react";

type Props = {
  id?: string;
  label?: string;
  type?: string;
  placeholder?: string;
  value?: string;
  onChange?: (v: string) => void;
  className?: string;
};

export default function Input({ id, type = "text", placeholder, value, onChange, className = "" }: Props) {
  return (
    <div style={{ width: "100%" }}>
      <input
        id={id}
        className={`input ${className}`}
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange && onChange(e.target.value)}
      />
    </div>
  );
}
