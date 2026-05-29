export function calculateSavings(
  tool: string,
  spend: number
) {
  if (tool === "ChatGPT" && spend > 25) {
    return {
      recommendation: "Switch to ChatGPT Plus",
      savings: spend - 20,
    };
  }

  if (tool === "Claude" && spend > 30) {
    return {
      recommendation: "Downgrade Claude plan",
      savings: spend - 20,
    };
  }

  return {
    recommendation: "Current plan is optimal",
    savings: 0,
  };
}
