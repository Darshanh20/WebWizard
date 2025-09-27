import React, { useEffect } from "react";

export default function Toast({ open, message, onClose }) {
  useEffect(() => {
    if (open) {
      const t = setTimeout(() => onClose && onClose(), 3000);
      return () => clearTimeout(t);
    }
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <div className="bg-green-600 text-white px-4 py-2 rounded shadow-lg">
        {message}
      </div>
    </div>
  );
}
