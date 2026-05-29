"use client";

import { useState } from "react";

export default function SpendForm() {
  const [tool, setTool] = useState("");
  const [spend, setSpend] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    alert(`Tool: ${tool} | Spend: ${spend}`);
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-zinc-900 p-6 rounded-2xl space-y-4"
    >
      <div>
        <label className="block mb-2">AI Tool</label>

        <select
          value={tool}
          onChange={(e) => setTool(e.target.value)}
          className="w-full p-3 rounded-lg bg-black border border-zinc-700"
        >
          <option value="">Select Tool</option>
          <option>ChatGPT</option>
          <option>Claude</option>
          <option>Cursor</option>
          <option>Copilot</option>
        </select>
      </div>

      <div>
        <label className="block mb-2">Monthly Spend ($)</label>

        <input
          type="number"
          value={spend}
          onChange={(e) => setSpend(e.target.value)}
          className="w-full p-3 rounded-lg bg-black border border-zinc-700"
        />
      </div>

      <button
        type="submit"
        className="bg-white text-black px-6 py-3 rounded-xl font-semibold"
      >
        Generate Audit
      </button>
    </form>
  );
}
