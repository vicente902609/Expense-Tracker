type InsightSeed = {
  monthlySavingsRate: number;
  projectedEta: string | null;
  targetDate: string;
  suggestedCategoryCut: string | null;
  suggestedCutAmount: number;
  status: "on_track" | "at_risk" | "achieved" | "insufficient_data";
};

export const buildGoalEtaInsight = (seed: InsightSeed): string => {
  if (seed.status === "insufficient_data") {
    return "Add a budget plan and at least a few expenses before we estimate your goal with confidence.";
  }

  if (seed.status === "achieved") {
    return "You have already reached this goal based on your current saved amount.";
  }

  if (seed.status === "on_track") {
    return `You're saving about $${seed.monthlySavingsRate.toFixed(0)}/month. At this pace you'll hit your goal by ${seed.projectedEta}, on or before your target date.`;
  }

  const categoryPart =
    seed.suggestedCategoryCut && seed.suggestedCutAmount > 0
      ? ` Cut ${seed.suggestedCategoryCut} by about $${seed.suggestedCutAmount}/month to recover pace.`
      : "";

  return `You're saving about $${seed.monthlySavingsRate.toFixed(0)}/month. At this pace you'll hit your goal by ${seed.projectedEta ?? "a later date than planned"}, behind your ${seed.targetDate} target.${categoryPart}`;
};
