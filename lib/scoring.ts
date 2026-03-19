export function computeContribution(
  hintsUsed: number,
  stageReached: number,
  solved: boolean,
  durationSeconds: number
): number {
  return (
    (3 - hintsUsed) * 10 +
    stageReached * 5 +
    (solved ? 20 : 0) +
    (durationSeconds < 900 ? 10 : 0)
  );
}

export function computeNewScore(oldScore: number, contribution: number): number {
  return Math.min(100, Math.round(oldScore * 0.7 + contribution * 0.3));
}
