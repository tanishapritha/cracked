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

  // Thermal Logic
  const isSyntaxOff = hint?.includes("(Local)");
  const isLogicOff = status === "OFF_TRACK" && !isSyntaxOff;
  const isPerfect = status === "ON_TRACK" && !isSyntaxOff;

  const getStatusColor = () => {
    if (isMuted) return "bg-gray-800 border-gray-700 opacity-20 grayscale";
    if (status === "THINKING") return "bg-blue-500/20 border-blue-500/40 shadow-[0_0_30px_rgba(59,130,246,0.3)]";
    if (isPerfect) return "bg-[#84cc16]/20 border-[#84cc16]/40 shadow-[0_0_30px_rgba(132,204,22,0.4)] transition-all duration-1000";
    if (isSyntaxOff) return "bg-amber-500/20 border-amber-500/40 shadow-[0_0_30px_rgba(245,158,11,0.4)] transition-all duration-500";
    if (isLogicOff) return "bg-red-500/20 border-red-500/40 shadow-[0_0_30px_rgba(239,68,68,0.5)] transition-all duration-300";
    return "bg-white/5 border-white/10";
  };

  const getOrbColor = () => {
    if (isMuted) return "bg-gray-600";
    if (status === "THINKING") return "bg-blue-400 animate-pulse";
    if (isPerfect) return "bg-[#84cc16]";
    if (isSyntaxOff) return "bg-amber-500";
    if (isLogicOff) return "bg-red-500";
    return "bg-white/20";
  };

  return (
    <motion.div 
      initial={false}
      animate={{
        // Docks smoothly to the right margin vertically aligned with current line
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
            initial={{ opacity: 0, scale: 0.9, x: 20 }}
            animate={{ opacity: 1, scale: 1, x: 0 }}
            exit={{ opacity: 0, scale: 0.9, x: 20 }}
            className="pointer-events-auto bg-[#0a0a0a]/95 backdrop-blur-2xl border border-white/10 p-4 rounded-2xl text-[12px] text-[#f5f5f5] font-medium min-w-[240px] shadow-2xl ring-1 ring-white/10"
          >
            <div className="flex items-center gap-2 mb-3">
              <div className={`w-2 h-2 rounded-full ${getOrbColor()} shadow-sm shadow-black`} />
              <span 
                className={`uppercase text-[10px] font-black tracking-[0.2em] 
                ${isSyntaxOff ? 'text-amber-500' : isLogicOff ? 'text-red-500' : isPerfect ? 'text-[#84cc16]' : 'text-zinc-500'}`}
              >
                {isSyntaxOff ? "SYNTAX WARNING" : isLogicOff ? "LOGIC ALERT" : isPerfect ? "峰 FLOW STATE" : "SENTINEL LISTENING"}
              </span>
            </div>
            
            <div className="space-y-3">
              <p className="leading-relaxed text-zinc-300 antialiased italic">
                "{hint}"
              </p>
              
              {isLogicOff && (
                <button 
                  onClick={onClickHelp}
                  className="w-full text-center py-2 bg-white/5 hover:bg-white/10 border border-white/5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all hover:scale-[1.02] active:scale-[0.98]"
                >
                  Retrieve Deep Coaching
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="relative pointer-events-auto group">
        <motion.button
          onClick={onClickHelp}
          animate={{
            scale: status === "THINKING" ? [1, 1.25, 1] : 1,
            rotate: status === "THINKING" ? [0, 90, 180, 270, 360] : 0
          }}
          transition={{
            scale: { duration: 1, repeat: Infinity },
            rotate: { duration: 2.5, repeat: Infinity, ease: "linear" }
          }}
          className={`relative w-9 h-9 rounded-full border backdrop-blur-md flex items-center justify-center transition-all duration-700 overflow-hidden ${getStatusColor()} ${
            (isSyntaxOff || isLogicOff) ? "cursor-help active:scale-95 shadow-xl" : "cursor-default border-indigo-500/10"
          }`}
        >
          {/* Bioluminescent Micro-Core */}
          <motion.div 
            animate={{
              boxShadow: (isSyntaxOff || isLogicOff) ? `0 0 20px ${isSyntaxOff ? '#f59e0b' : '#ef4444'}` : "none",
              scale: isPerfect ? [1, 1.1, 1] : 1
            }}
            className={`w-2 h-2 rounded-full relative z-10 ${getOrbColor()} shadow-sm shadow-black`}
          />

          {/* Mute Panel Reveal */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggleMute();
            }}
            className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-20 bg-black/70 rounded-full"
          >
            <span className="text-[10px] filter invert grayscale">{isMuted ? "🔈" : "🔇"}</span>
          </button>
        </motion.button>
        
        {/* Glow Halo for Critical Error */}
        {isLogicOff && !isMuted && (
          <div className="absolute inset-x-0 inset-y-0 rounded-full animate-ping pointer-events-none opacity-10 bg-red-500 scale-150" />
        )}
      </div>
    </motion.div>
  );
}
