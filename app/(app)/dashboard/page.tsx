import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { problems } from "@/lib/problems";
import { getSkillLabel, getSkillColor } from "@/lib/types";
import Link from "next/link";

export default async function DashboardPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  // fetch skill scores
  const { data: skills } = await supabase
    .from("skill_scores")
    .select("*")
    .eq("user_id", user.id)
    .order("topic");

  // fetch sessions
  const { data: sessions } = await supabase
    .from("sessions")
    .select("*")
    .eq("user_id", user.id)
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

      {/* skill bars */}
      <div className="bg-[#141414] border border-[#1f1f1f] p-6 mb-8">
        <h2 className="text-sm font-medium text-[#f5f5f5] mb-4">Skill map</h2>
        <div className="space-y-3">
          {(skills || []).map((skill: any) => (
            <div key={skill.topic} className="flex items-center gap-3">
              <span className="text-xs text-[#737373] w-32 text-right">
                {skill.topic}
              </span>
              <div className="flex-1 h-2 bg-[#1f1f1f] overflow-hidden">
                <div
                  className="h-full transition-all duration-500"
                  style={{
                    width: `${skill.score}%`,
                    backgroundColor: getSkillColor(skill.score),
                  }}
                />
              </div>
              <span
                className="text-xs w-12 text-right"
                style={{ color: getSkillColor(skill.score) }}
              >
                {skill.score}
              </span>
              <span className="text-[10px] text-[#737373] w-12">
                {getSkillLabel(skill.score)}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* recommended next */}
      {recommended.length > 0 && (
        <div className="bg-[#141414] border border-[#1f1f1f] p-6">
          <h2 className="text-sm font-medium text-[#f5f5f5] mb-4">
            Recommended next
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {recommended.map((p) => (
              <Link
                key={p.slug}
                href={`/coach/${p.slug}`}
                className="bg-[#0a0a0a] border border-[#1f1f1f] p-4 hover:border-[#84cc16]/30 transition-colors group"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-[#f5f5f5] group-hover:text-[#84cc16] transition-colors">
                    {p.title}
                  </span>
                  <span
                    className={`text-[10px] ${
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
                <div className="flex gap-1">
                  {p.topics.map((t) => (
                    <span
                      key={t}
                      className="text-[10px] px-1.5 py-0.5 bg-[#1f1f1f] text-[#737373]"
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
    <div className="bg-[#141414] border border-[#1f1f1f] p-5">
      <p className="text-xs text-[#737373] mb-1">{label}</p>
      <p
        className="text-2xl font-semibold"
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
