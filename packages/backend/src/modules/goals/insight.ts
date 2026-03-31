type InsightSeed = {
  monthlySavingsRate: number;
  projectedEta: string | null;
  targetDate: string | null;
  suggestedCategoryCut: string | null;
  suggestedCutAmount: number;
  status: "on_track" | "at_risk" | "achieved" | "insufficient_data";
};

export const buildGoalEtaInsight = (seed: InsightSeed): string => {
  if (seed.status === "insufficient_data") {
    return "Set your monthly target expense to unlock a trustworthy goal forecast.";
  }

  if (seed.status === "achieved") {
    return "You have already reached this goal based on your current saved amount.";
  }

  if (seed.status === "on_track") {
    const monthlyText =
      seed.monthlySavingsRate >= 0 ? `saving about $${seed.monthlySavingsRate.toFixed(0)}/month` : `overspending by about $${Math.abs(seed.monthlySavingsRate).toFixed(0)}/month`;
    if (!seed.targetDate) {
      return `You're ${monthlyText}. At this pace you'll hit your goal by ${seed.projectedEta}.`;
    }
    return `You're ${monthlyText}. At this pace you'll hit your goal by ${seed.projectedEta}, on or before your target date.`;
  }

  const categoryPart =
    seed.suggestedCategoryCut && seed.suggestedCutAmount > 0
      ? ` Cut ${seed.suggestedCategoryCut} by about $${seed.suggestedCutAmount}/month to recover pace.`
      : "";

  const monthlyText =
    seed.monthlySavingsRate >= 0 ? `saving about $${seed.monthlySavingsRate.toFixed(0)}/month` : `overspending by about $${Math.abs(seed.monthlySavingsRate).toFixed(0)}/month`;

  if (!seed.targetDate) {
    return `You're ${monthlyText}. At this pace you'll hit your goal by ${seed.projectedEta ?? "a later date than planned"}.${categoryPart}`;
  }
  return `You're ${monthlyText}. At this pace you'll hit your goal by ${seed.projectedEta ?? "a later date than planned"}, behind your ${seed.targetDate} target.${categoryPart}`;
};
