import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getProblemBySlug } from "@/lib/problems";
import { computeContribution, computeNewScore } from "@/lib/scoring";

export async function POST(req: NextRequest) {
  try {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { problem_slug, stage_reached, hints_used, duration_seconds, solved } = body;

    const problem = getProblemBySlug(problem_slug);
    if (!problem) {
      return NextResponse.json({ error: "Problem not found" }, { status: 404 });
    }

    // record session
    const { error: sessionError } = await supabase.from("sessions").insert({
      user_id: user.id,
      problem_slug,
      stage_reached,
      hints_used,
      duration_seconds,
      solved,
    });

    if (sessionError) {
      console.error("Failed to insert session:", sessionError);
      return NextResponse.json({ error: "Failed to save session" }, { status: 500 });
    }

    // update skill scores for all topics of this problem
    const contribution = computeContribution(
      hints_used,
      stage_reached,
      solved,
      duration_seconds
    );

    for (const topic of problem.topics) {
      const { data: skillData } = await supabase
        .from("skill_scores")
        .select("score")
        .eq("user_id", user.id)
        .eq("topic", topic)
        .single();

      const oldScore = skillData?.score || 0;
      const newScore = computeNewScore(oldScore, contribution);

      await supabase
        .from("skill_scores")
        .update({ score: newScore })
        .eq("user_id", user.id)
        .eq("topic", topic);
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Session complete error:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
