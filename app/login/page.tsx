"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    router.push("/dashboard");
    router.refresh();
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0a0a0a] px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-medium tracking-tight text-[#f5f5f5]">
            cracked<span className="text-[#84cc16]">]</span>
          </h1>
          <p className="text-sm text-[#737373] mt-2">
            Sign in to continue
          </p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email" className="text-[#f5f5f5] text-sm">
              Email
            </Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              className="bg-[#141414] border-[#1f1f1f] text-[#f5f5f5] placeholder:text-[#737373] focus:border-[#84cc16] focus:ring-[#84cc16]/20"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password" className="text-[#f5f5f5] text-sm">
              Password
            </Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="your password"
              required
              className="bg-[#141414] border-[#1f1f1f] text-[#f5f5f5] placeholder:text-[#737373] focus:border-[#84cc16] focus:ring-[#84cc16]/20"
            />
          </div>

          {error && (
            <p className="text-sm text-[#ef4444]">{error}</p>
          )}

          <Button
            type="submit"
            disabled={loading}
            className="w-full bg-[#84cc16] text-[#0a0a0a] font-medium hover:bg-[#84cc16]/90 transition-colors"
          >
            {loading ? "Signing in..." : "Sign in"}
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-[#737373]">
          No account?{" "}
          <Link href="/signup" className="text-[#84cc16] hover:underline">
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
}
