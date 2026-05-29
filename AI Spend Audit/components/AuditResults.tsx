type Props = {
  savings: number;
};

export default function AuditResults({ savings }: Props) {
  return (
    <div className="bg-zinc-900 p-6 rounded-2xl mt-6">
      <h2 className="text-3xl font-bold">
        Estimated Savings
      </h2>

      <p className="text-5xl mt-4 font-bold text-green-400">
        ${savings}
      </p>

      <p className="text-zinc-400 mt-3">
        You may be overspending on AI subscriptions.
      </p>
    </div>
  );
}
