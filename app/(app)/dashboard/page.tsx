import { createClient } from "@/lib/supabase/server";
import { problems } from "@/lib/problems";
import { getSkillLabel, getSkillColor, TOPICS } from "@/lib/types";
import Link from "next/link";
import { LeetCodeConnect } from "@/components/leetcode-connect";

export default async function DashboardPage() {
  const userId = "anonymous_user";

  const supabase = createClient();

  // Try to create the user rows if they don't exist yet (first sign in sync)
  const { data: userRow } = await supabase.from("users").select("id").eq("id", userId).single();
  if (!userRow) {
    await supabase.from("users").insert({ id: userId, email: "anonymous@example.com" });
    const skillRows = TOPICS.map((topic) => ({ user_id: userId, topic, score: 0 }));
    await supabase.from("skill_scores").insert(skillRows);
  }

  // fetch skill scores
  const { data: skills } = await supabase
    .from("skill_scores")
    .select("*")
    .eq("user_id", userId)
    .order("topic");

  // fetch sessions
  const { data: sessions } = await supabase
    .from("sessions")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  const totalSessions = sessions?.length || 0;

  // compute streak
  const streak = computeStreak(sessions || []);

  // average skill score
  const avgScore =
    skills && skills.length > 0
      ? Math.round(
          skills.reduce((sum: number, s: any) => sum + s.score, 0) / skills.length
        )
      : 0;

  // recommended problems: topics with lowest scores, not yet solved cleanly
  const cleanSolves = new Set(
    (sessions || [])
      .filter((s: any) => s.solved && s.hints_used === 0 && s.stage_reached === 6)
      .map((s: any) => s.problem_slug)
  );

  const topicScoreMap = new Map<string, number>();
  (skills || []).forEach((s: any) => topicScoreMap.set(s.topic, s.score));

  const recommended = problems
    .filter((p) => !cleanSolves.has(p.slug))
    .sort((a, b) => {
      const aMin = Math.min(...a.topics.map((t) => topicScoreMap.get(t) || 0));
      const bMin = Math.min(...b.topics.map((t) => topicScoreMap.get(t) || 0));
      return aMin - bMin;
    })
    .slice(0, 3);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-2xl font-semibold text-[#f5f5f5] mb-6">Dashboard</h1>

      {/* stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <StatCard label="Problems coached" value={totalSessions.toString()} />
        <StatCard
          label="Current streak"
          value={`${streak} day${streak !== 1 ? "s" : ""}`}
        />
        <StatCard
          label="Interview readiness"
          value={`${avgScore}%`}
          valueColor={getSkillColor(avgScore)}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
        {/* skill bars */}
        <div className="lg:col-span-2 bg-[#080808] border border-[#1a1a1a] p-6 shadow-sm">
          <h2 className="text-sm font-bold uppercase tracking-widest text-[#525252] mb-6">Skill map</h2>
          <div className="space-y-4">
            {(skills || []).map((skill: any) => (
              <div key={skill.topic} className="flex items-center gap-4">
                <span className="text-[10px] font-bold uppercase text-[#737373] w-28 text-right shrink-0">
                  {skill.topic}
                </span>
                <div className="flex-1 h-3 bg-[#111111] border border-[#1a1a1a] overflow-hidden">
                  <div
                    className="h-full transition-all duration-700 ease-out"
                    style={{
                      width: `${skill.score}%`,
                      backgroundColor: getSkillColor(skill.score),
                    }}
                  />
                </div>
                <span
                  className="text-xs font-mono font-bold w-12 text-right"
                  style={{ color: getSkillColor(skill.score) }}
                >
                  {skill.score}%
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* leetcode connect */}
        <div className="lg:col-span-1">
          <LeetCodeConnect />
        </div>
      </div>

      {/* recommended next */}
      {recommended.length > 0 && (
        <div className="bg-[#080808] border border-[#1a1a1a] p-6 shadow-sm">
          <h2 className="text-sm font-bold uppercase tracking-widest text-[#525252] mb-6">
            Recommended next
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {recommended.map((p) => (
              <Link
                key={p.slug}
                href={`/coach/${p.slug}`}
                className="bg-[#050505] border border-[#1a1a1a] p-5 hover:border-[#84cc16]/50 transition-all group hover:bg-[#0a0a0a]"
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="text-base font-bold text-[#f5f5f5] group-hover:text-[#84cc16] transition-colors">
                    {p.title}
                  </span>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 border border-current/10 ${
                      p.difficulty === "Easy"
                        ? "text-[#22c55e]"
                        : p.difficulty === "Medium"
                        ? "text-[#f59e0b]"
                        : "text-[#ef4444]"
                    }`}
                  >
                    {p.difficulty}
                  </span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {p.topics.map((t) => (
                    <span
                      key={t}
                      className="text-[9px] font-bold px-2 py-0.5 bg-[#111111] text-[#525252] uppercase tracking-tighter"
                    >
                      {t}
                    </span>
                  ))}
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({
  label,
  value,
  valueColor,
}: {
  label: string;
  value: string;
  valueColor?: string;
}) {
  return (
    <div className="bg-[#080808] border border-[#1a1a1a] p-6 shadow-sm">
      <p className="text-[10px] font-bold uppercase tracking-widest text-[#525252] mb-2">{label}</p>
      <p
        className="text-3xl font-bold tracking-tighter"
        style={{ color: valueColor || "#f5f5f5" }}
      >
        {value}
      </p>
    </div>
  );
}

function computeStreak(sessions: any[]): number {
  if (sessions.length === 0) return 0;

  const days = new Set(
    sessions.map((s) => new Date(s.created_at).toDateString())
  );

  let streak = 0;
  const now = new Date();
  for (let i = 0; i < 365; i++) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    if (days.has(d.toDateString())) {
      streak++;
    } else if (i > 0) {
      break;
    }
  }
  return streak;
}
