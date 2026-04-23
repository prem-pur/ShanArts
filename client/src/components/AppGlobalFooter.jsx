import React from "react";

/** Slim bottom bar: copyright (left) + location tagline (right). Shown on every route via App.jsx */
export default function AppGlobalFooter() {
  return (
    <footer className="app-footer" role="contentinfo" aria-label="Site footer">
      <span>© {new Date().getFullYear()} Shan Art Advertising. All rights reserved.</span>
      <span>Built with precision — Anuradhapura, LK 🇱🇰</span>
    </footer>
  );
}
