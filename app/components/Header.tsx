"use client";
import React from "react";

export default function Header() {
  return (
    <header className="app-header">
      {/* header-inner left intentionally empty so logo appears only on products page */}
      <div className="header-inner" aria-hidden />
      <div className="header-actions" aria-hidden />
    </header>
  );
}
