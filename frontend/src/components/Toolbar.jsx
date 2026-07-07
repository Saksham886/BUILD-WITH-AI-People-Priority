export default function Toolbar({ onSeed, onRefresh, onReset, busy }) {
  const btn =
    "rounded-lg px-3.5 py-2 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-50";
  return (
    <div className="flex flex-wrap gap-2">
      <button
        onClick={onSeed}
        disabled={busy}
        className={`${btn} bg-indigo-600 text-white hover:bg-indigo-700`}
      >
        Load sample data
      </button>
      <button
        onClick={onRefresh}
        disabled={busy}
        className={`${btn} bg-white text-slate-700 ring-1 ring-inset ring-slate-300 hover:bg-slate-50`}
      >
        Refresh
      </button>
      <button
        onClick={onReset}
        disabled={busy}
        className={`${btn} bg-white text-red-600 ring-1 ring-inset ring-red-300 hover:bg-red-50`}
      >
        Reset
      </button>
    </div>
  );
}
