"use client";
import React from "react";

type Props = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  children: React.ReactNode;
};

export default function Button({ children, ...rest }: Props) {
  return (
    <button className="cta" {...rest}>
      {children}
    </button>
  );
}
