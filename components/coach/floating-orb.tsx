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

  const getStatusColor = () => {
    if (isMuted) return "bg-gray-800 border-gray-700 shadow-none grayscale opacity-30";
    if (status === "THINKING") return "bg-blue-500/20 border-blue-500/40 shadow-[0_0_20px_rgba(59,130,246,0.2)]";
    if (status === "ON_TRACK") return "bg-[#84cc16]/20 border-[#84cc16]/40 shadow-[0_0_20px_rgba(132,204,22,0.2)]";
    if (status === "OFF_TRACK") return "bg-[#ef4444]/20 border-[#ef4444]/40 shadow-[0_0_20px_rgba(239,68,68,0.2)]";
    return "bg-[#1a1a1a] border-[#333] shadow-md";
  };

  const getOrbColor = () => {
    if (isMuted) return "bg-gray-600";
    if (status === "THINKING") return "bg-blue-500";
    if (status === "ON_TRACK") return "bg-[#84cc16]";
    if (status === "OFF_TRACK") return "bg-[#ef4444]";
    return "bg-[#525252]";
  };

  return (
    <motion.div 
      initial={false}
      animate={{
        // Follow cursor with a small offset to the right and slightly above
        x: position ? position.x + 20 : 0,
        y: position ? position.y - 20 : 0,
        opacity: position ? opacity : 0
      }}
      transition={{ type: "spring", damping: 30, stiffness: 150 }}
      className="absolute top-0 left-0 z-[999] flex flex-col items-start gap-2 pointer-events-auto"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <AnimatePresence>
        {showHint && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, x: -10 }}
            animate={{ opacity: 1, scale: 1, x: 0 }}
            exit={{ opacity: 0, scale: 0.9, x: -10 }}
            className="pointer-events-auto bg-[#080808]/90 backdrop-blur-xl border border-white/5 p-3 rounded-2xl text-[11px] text-[#f5f5f5] font-medium min-w-[200px] shadow-2xl ring-1 ring-white/10"
          >
            <div className="flex items-center gap-2 mb-2">
              <div className={`w-1.5 h-1.5 rounded-full ${status === "ON_TRACK" ? "bg-[#84cc16]" : "bg-[#ef4444]"}`} />
              <span className={`uppercase text-[9px] font-black tracking-widest ${status === "ON_TRACK" ? "text-[#84cc16]" : "text-[#ef4444]"}`}>
                {status === "ON_TRACK" ? "Correct Path" : "Coach Advice"}
              </span>
            </div>
            <p className="leading-relaxed opacity-90">{hint}</p>
            {status === "OFF_TRACK" && (
              <button 
                onClick={onClickHelp}
                className="mt-2 w-full text-center py-1.5 bg-white/5 hover:bg-white/10 rounded-lg text-[9px] font-bold uppercase tracking-widest transition-colors"
              >
                Discuss with Coach
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="relative pointer-events-auto group">
        <motion.button
          onClick={onClickHelp}
          animate={{
            y: [0, -2, 0],
            rotate: status === "THINKING" ? [0, 90, 180, 270, 360] : 0
          }}
          transition={{
            y: { duration: 4, repeat: Infinity, ease: "easeInOut" },
            rotate: { duration: 3, repeat: Infinity, ease: "linear" }
          }}
          className={`relative w-9 h-9 rounded-full border border-white/10 backdrop-blur-md flex items-center justify-center transition-all duration-500 overflow-hidden ${getStatusColor()} ${
            status === "OFF_TRACK" ? "cursor-help active:scale-95" : "cursor-default"
          }`}
        >
          {/* Core Orb */}
          <motion.div 
            animate={{
              scale: status === "THINKING" ? [1, 1.3, 1] : 1,
              boxShadow: status === "OFF_TRACK" ? "0 0 15px rgba(239,68,68,0.5)" : "none"
            }}
            className={`w-2 h-2 rounded-full relative z-10 ${getOrbColor()}`}
          />

          {/* Mute Toggle */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggleMute();
            }}
            className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-20 bg-black/40 rounded-full"
          >
            <span className="text-[10px]">{isMuted ? "🔈" : "🔇"}</span>
          </button>
        </motion.button>
      </div>
    </motion.div>
  );
}
