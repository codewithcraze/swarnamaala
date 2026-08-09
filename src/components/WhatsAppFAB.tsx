"use client";

import { useState } from "react";

const WA_NUMBER = "919084248821";
const WA_MESSAGE = encodeURIComponent(
  "Hi! I'd like to order custom photo magnets from swarnamaala.in 🧲"
);
const WA_URL = `https://wa.me/${WA_NUMBER}?text=${WA_MESSAGE}`;

export default function WhatsAppFAB() {
  const [hovered, setHovered] = useState(false);

  return (
    <div className="fixed bottom-5 right-4 z-50 flex items-center gap-3 sm:bottom-6 sm:right-6">
      {/* Tooltip label — shown on hover/focus */}
      <span
        className={`hidden rounded-full bg-charcoal px-3.5 py-2 text-sm font-medium text-white shadow-lg transition-all duration-200 sm:inline-block ${
          hovered ? "opacity-100 translate-x-0" : "pointer-events-none opacity-0 translate-x-2"
        }`}
      >
        Chat with us
      </span>

      <a
        href={WA_URL}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Chat on WhatsApp"
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        onFocus={() => setHovered(true)}
        onBlur={() => setHovered(false)}
        className="group flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] shadow-xl shadow-[#25D366]/30 transition-transform hover:scale-110 focus:scale-110 focus:outline-none focus:ring-2 focus:ring-[#25D366] focus:ring-offset-2"
      >
        {/* WhatsApp SVG */}
        <svg
          viewBox="0 0 32 32"
          className="h-7 w-7 fill-white"
          aria-hidden="true"
        >
          <path d="M16.003 3.2C9.004 3.2 3.2 9.004 3.2 16.003c0 2.29.597 4.435 1.64 6.296L3.2 28.8l6.683-1.614A12.7 12.7 0 0 0 16.003 28.8c6.999 0 12.797-5.804 12.797-12.797C28.8 9.004 23.002 3.2 16.003 3.2zm6.3 17.87c-.264.742-1.542 1.458-2.11 1.497-.568.04-1.106.274-3.725-.777-3.15-1.263-5.146-4.42-5.302-4.623-.155-.203-1.268-1.687-1.268-3.22s.802-2.286 1.087-2.599c.284-.313.62-.392.826-.392s.412.003.592.01c.19.008.445-.072.697.533.258.617.876 2.13.955 2.285.08.154.133.334.026.537-.104.203-.156.33-.31.508-.154.18-.324.4-.463.537-.154.151-.313.316-.135.62.178.303.794 1.31 1.706 2.12 1.174 1.048 2.163 1.372 2.466 1.527.303.154.48.13.656-.078.179-.207.759-.885 1.361-1.764l.025-.037c.21-.33.42-.276.7-.166.283.11 1.79.845 2.097.997.308.154.514.228.59.357.077.13.077.745-.187 1.487z" />
        </svg>

        {/* Pulse ring */}
        <span className="absolute h-14 w-14 animate-ping rounded-full bg-[#25D366] opacity-30" aria-hidden="true" />
      </a>
    </div>
  );
}
