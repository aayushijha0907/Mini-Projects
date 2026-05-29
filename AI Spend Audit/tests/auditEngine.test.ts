import { calculateSavings } from "../lib/auditEngine";

test("returns savings for expensive ChatGPT plan", () => {
  const result = calculateSavings("ChatGPT", 50);

  expect(result.savings).toBeGreaterThan(0);
});
