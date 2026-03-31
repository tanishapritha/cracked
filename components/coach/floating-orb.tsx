"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";

interface FloatingOrbProps {
  status: "ON_TRACK" | "OFF_TRACK" | "IDLE" | "THINKING" | null;
  hint?: string;
  isMuted: boolean;
  position?: { x: number; y: number };
  opacity?: number;
  onToggleMute: () => void;
  onClickHelp: () => void;
}

export function FloatingOrb({ status, hint, isMuted, position, opacity = 1, onToggleMute, onClickHelp }: FloatingOrbProps) {
  const [isHovered, setIsHovered] = useState(false);

  // Hover auto-show for hint
  const showHint = isHovered && hint && !isMuted;

  // Temperature logic
  const isSyntaxOff = hint?.includes("(Local)");
  const isLogicOff = status === "OFF_TRACK" && !isSyntaxOff;

  const getStatusColor = () => {
    if (isMuted) return "bg-gray-800 border-gray-700 opacity-30";
    if (status === "THINKING") return "bg-blue-500/20 border-blue-500/40 shadow-[0_0_20px_rgba(59,130,246,0.3)]";
    if (status === "ON_TRACK") return "bg-green-500/20 border-green-500/40 shadow-[0_0_20px_rgba(34,197,94,0.3)]";
    if (isSyntaxOff) return "bg-amber-500/20 border-amber-500/40 shadow-[0_0_20px_rgba(245,158,11,0.3)]";
    if (isLogicOff) return "bg-red-500/20 border-red-500/40 shadow-[0_0_20px_rgba(239,68,68,0.3)]";
    return "bg-white/5 border-white/10";
  };

  const getOrbColor = () => {
    if (isMuted) return "bg-gray-600";
    if (status === "THINKING") return "bg-blue-400";
    if (status === "ON_TRACK") return "bg-green-500";
    if (isSyntaxOff) return "bg-amber-500";
    if (isLogicOff) return "bg-red-500";
    return "bg-white/20";
  };

  return (
    <motion.div 
      initial={false}
      animate={{
        // Now it follows y but x is docked to the right margin from page.tsx props
        x: position ? position.x : 0, 
        y: position ? position.y : 0,
        opacity: position ? opacity : 0
      }}
      transition={{ type: "spring", damping: 30, stiffness: 200 }}
      className="absolute top-0 left-0 z-[999] flex flex-col items-end gap-2 pointer-events-auto"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <AnimatePresence>
        {showHint && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, x: 10 }}
            animate={{ opacity: 1, scale: 1, x: 0 }}
            exit={{ opacity: 0, scale: 0.9, x: 10 }}
            className="pointer-events-auto bg-[#0a0a0a]/90 backdrop-blur-xl border border-white/5 p-3 rounded-2xl text-[11px] text-[#f5f5f5] font-medium min-w-[220px] shadow-2xl ring-1 ring-white/10"
          >
            <div className="flex items-center gap-2 mb-2">
              <div className={`w-1.5 h-1.5 rounded-full ${getOrbColor()}`} />
              <span className={`uppercase text-[9px] font-black tracking-widest ${isSyntaxOff ? 'text-amber-500' : isLogicOff ? 'text-red-500' : 'text-green-500'}`}>
                {isSyntaxOff ? "Syntax Warning" : isLogicOff ? "Logic Alert" : "Everything Correct"}
              </span>
            </div>
            <p className="leading-relaxed opacity-90">{hint}</p>
            {isLogicOff && (
              <button 
                onClick={onClickHelp}
                className="mt-3 w-full text-center py-2 bg-white/5 hover:bg-white/10 rounded-lg text-[9px] font-black uppercase tracking-widest transition-colors border border-white/5"
              >
                Reveal Deep Coaching
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="relative pointer-events-auto group">
        <motion.button
          onClick={onClickHelp}
          animate={{
            scale: status === "THINKING" ? [1, 1.2, 1] : 1,
            rotate: status === "THINKING" ? [0, 90, 180, 270, 360] : 0
          }}
          transition={{
            scale: { duration: 1, repeat: Infinity },
            rotate: { duration: 3, repeat: Infinity, ease: "linear" }
          }}
          className={`relative w-8 h-8 rounded-full border backdrop-blur-md flex items-center justify-center transition-all duration-700 overflow-hidden ${getStatusColor()} ${
            (isSyntaxOff || isLogicOff) ? "cursor-help active:scale-95 shadow-lg" : "cursor-default"
          }`}
        >
          {/* Internal Bioluminescent Core */}
          <motion.div 
            animate={{
              boxShadow: (isSyntaxOff || isLogicOff) ? `0 0 15px ${isSyntaxOff ? '#f59e0b' : '#ef4444'}` : "none"
            }}
            className={`w-1.5 h-1.5 rounded-full relative z-10 ${getOrbColor()}`}
          />

          {/* Mute Reveal Toggle */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggleMute();
            }}
            className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-20 bg-black/60 rounded-full"
          >
            <span className="text-[10px]">{isMuted ? "🔈" : "🔇"}</span>
          </button>
        </motion.button>
      </div>
    </motion.div>
  );
}
