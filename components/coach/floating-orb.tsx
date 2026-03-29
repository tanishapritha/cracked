"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";

interface FloatingOrbProps {
  status: "ON_TRACK" | "OFF_TRACK" | "IDLE" | "THINKING" | null;
  hint?: string;
  isMuted: boolean;
  onToggleMute: () => void;
  onClickHelp: () => void;
}

export function FloatingOrb({ status, hint, isMuted, onToggleMute, onClickHelp }: FloatingOrbProps) {
  const [isHovered, setIsHovered] = useState(false);

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
    <div 
      className="absolute bottom-6 right-6 flex flex-col items-end gap-3 pointer-events-none"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <AnimatePresence>
        {hint && status === "OFF_TRACK" && !isMuted && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.9 }}
            className="pointer-events-auto bg-[#080808]/90 backdrop-blur-md border border-[#ef4444]/20 px-3 py-2 rounded-xl text-[10px] text-[#ef4444] font-bold max-w-[180px] shadow-2xl"
          >
            <span className="opacity-60 block uppercase text-[8px] mb-1 font-black tracking-widest text-[#ef4444]">
              ALEX ASKS
            </span>
            {hint}
            <div className="mt-1.5 pt-1.5 border-t border-[#ef4444]/10 text-[9px] opacity-70 italic">
              Click to see why
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="relative pointer-events-auto group">
        <motion.button
          onClick={onClickHelp}
          animate={{
            y: [0, -4, 0],
            rotate: status === "THINKING" ? [0, 180, 360] : 0
          }}
          transition={{
            y: { duration: 3, repeat: Infinity, ease: "easeInOut" },
            rotate: { duration: 2, repeat: Infinity, ease: "linear" }
          }}
          className={`relative w-12 h-12 rounded-full border-2 backdrop-blur-md flex items-center justify-center transition-all duration-500 overflow-hidden ${getStatusColor()} ${
            status === "OFF_TRACK" ? "cursor-help active:scale-90" : "cursor-default"
          }`}
        >
          {/* Internal Glow */}
          <div className={`absolute inset-0 opacity-20 blur-xl ${getOrbColor()}`} />
          
          {/* Core Orb */}
          <motion.div 
            animate={{
              scale: status === "THINKING" ? [1, 1.2, 1] : status === "OFF_TRACK" ? [1, 1.1, 1] : 1,
              opacity: isMuted ? 0.3 : 1
            }}
            transition={{ duration: 1, repeat: Infinity }}
            className={`w-3 h-3 rounded-full relative z-10 ${getOrbColor()} shadow-[0_0_10px_currentColor]`}
          />

          {/* Mute Toggle Layer (Top Right) */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggleMute();
            }}
            className="absolute top-0 right-0 p-1 opacity-0 group-hover:opacity-100 transition-opacity z-20 text-[8px] text-white"
          >
            {isMuted ? "🔈" : "🔇"}
          </button>
        </motion.button>
        
        {/* Status Label (Hover) */}
        {!isMuted && isHovered && (
          <motion.div 
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            className="absolute right-14 top-1/2 -translate-y-1/2 whitespace-nowrap bg-black/80 backdrop-blur-md px-2 py-1 rounded text-[9px] font-black uppercase tracking-widest text-white/50 border border-white/10"
          >
            {isMuted ? "MUTED" : status || "LISTENING"}
          </motion.div>
        )}
      </div>
    </div>
  );
}
