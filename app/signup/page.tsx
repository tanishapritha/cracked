"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { TOPICS } from "@/lib/types";

export default function SignupPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const supabase = createClient();

    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
    });

    if (signUpError) {
      setError(signUpError.message);
      setLoading(false);
      return;
    }

    if (data.user) {
      // create user row
      const { error: userError } = await supabase.from("users").insert({
        id: data.user.id,
        email: data.user.email,
      });

      if (userError && !userError.message.includes("duplicate")) {
        console.error("Failed to create user row:", userError);
      }

      // create skill_scores rows
      const skillRows = TOPICS.map((topic) => ({
        user_id: data.user!.id,
        topic,
        score: 0,
      }));

      const { error: skillError } = await supabase
        .from("skill_scores")
        .insert(skillRows);

      if (skillError) {
        console.error("Failed to create skill rows:", skillError);
      }
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
            Create your account
          </p>
        </div>

        <form onSubmit={handleSignup} className="space-y-4">
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
              placeholder="min 6 characters"
              required
              minLength={6}
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
            {loading ? "Creating account..." : "Create account"}
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-[#737373]">
          Already have an account?{" "}
          <Link href="/login" className="text-[#84cc16] hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
