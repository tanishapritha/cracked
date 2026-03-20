"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { fetchLeetCodeStats } from "@/lib/leetcode";
import { Loader2, Link2, CheckCircle2, AlertCircle } from "lucide-react";

export function LeetCodeConnect() {
  const [cookie, setCookie] = useState("");
  const [isConnecting, setIsConnecting] = useState(false);
  const [lastStats, setLastStats] = useState<any>(null);

  async function handleConnect() {
    if (!cookie.trim()) {
      toast.error("Please paste your LEETCODE_SESSION cookie.");
      return;
    }

    setIsConnecting(true);
    try {
      // In a real app, this would be a server action that saves to Supabase
      const stats = await fetchLeetCodeStats(cookie.trim());
      
      if (stats) {
        setLastStats(stats);
        toast.success(`Connected to LeetCode as ${stats.username}!`);
      } else {
        toast.error("Failed to connect. Is your cookie valid?");
      }
    } catch (err) {
      toast.error("An unexpected error occurred.");
    } finally {
      setIsConnecting(false);
    }
  }

  return (
    <div className="bg-[#141414] border border-[#1f1f1f] p-6 h-full flex flex-col justify-between">
      <div>
        <div className="flex items-center gap-2 mb-4">
          <Link2 className="w-5 h-5 text-[#84cc16]" />
          <h2 className="text-lg font-semibold text-[#f5f5f5]">Connect LeetCode</h2>
        </div>

        {lastStats ? (
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-3 bg-[#84cc16]/5 border border-[#84cc16]/20">
              <CheckCircle2 className="w-5 h-5 text-[#84cc16]" />
              <div>
                <p className="text-sm font-medium text-[#f5f5f5]">Account Linked</p>
                <p className="text-xs text-[#737373]">Synced as {lastStats.username}</p>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-[#0a0a0a] p-3 border border-[#1f1f1f]">
                <p className="text-[10px] text-[#737373] uppercase tracking-wider">Solved</p>
                <p className="text-xl font-bold text-[#84cc16]">{lastStats.solvedCount}</p>
              </div>
              <div className="bg-[#0a0a0a] p-3 border border-[#1f1f1f]">
                <p className="text-[10px] text-[#737373] uppercase tracking-wider">Recent</p>
                <p className="text-xs text-[#f5f5f5] truncate">
                  {lastStats.recentSubmissions[0]?.title || "None"}
                </p>
              </div>
            </div>
            
            <Button 
                variant="outline" 
                className="w-full text-xs h-8 border-[#1f1f1f] text-[#737373] hover:text-[#f5f5f5]"
                onClick={() => setLastStats(null)}
            >
                Disconnect
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-sm text-[#737373] leading-relaxed">
              Link your account to import your solved status and focus on what you haven't cracked yet.
            </p>
            
            <div className="space-y-2">
              <label className="text-[10px] text-[#737373] uppercase tracking-wider font-bold">
                LEETCODE_SESSION Cookie
              </label>
              <Input
                type="password"
                placeholder="Paste your session cookie..."
                value={cookie}
                onChange={(e) => setCookie(e.target.value)}
                className="bg-[#0a0a0a] border-[#1f1f1f] text-xs h-9"
              />
              <p className="text-[10px] text-[#525252]">
                Find this in your browser DevTools under Application &gt; Cookies.
              </p>
            </div>

            <Button
              className="w-full bg-[#f5f5f5] text-[#0a0a0a] hover:bg-[#e5e5e5] h-9 text-xs font-semibold"
              onClick={handleConnect}
              disabled={isConnecting}
            >
              {isConnecting ? (
                <>
                  <Loader2 className="w-3 h-3 mr-2 animate-spin" />
                  Connecting...
                </>
              ) : (
                "Sync Account"
              )}
            </Button>
          </div>
        )}
      </div>

      {!lastStats && (
        <div className="mt-6 flex items-start gap-2 text-yellow-500/80 bg-yellow-500/5 p-3 border border-yellow-500/10">
          <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
          <p className="text-[10px] leading-relaxed">
            We only use this to read your solved list. Your cookie never leaves our server-side secure flow.
          </p>
        </div>
      )}
    </div>
  );
}
