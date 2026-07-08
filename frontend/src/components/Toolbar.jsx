import { BsDatabaseFillAdd, BsArrowClockwise, BsTrash3 } from "react-icons/bs";

const BTN_STYLE = { padding: "14px 24px", fontSize: "0.95rem", display: "inline-flex", alignItems: "center", justifyContent: "center", gap: "8px" };

export default function Toolbar({ onSeed, onRefresh, onReset, busy }) {
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: "12px" }}>
      <button className="btn-primary" onClick={onSeed} disabled={busy} style={BTN_STYLE}>
        <BsDatabaseFillAdd /> Load sample data
      </button>
      <button className="btn-secondary" onClick={onRefresh} disabled={busy} style={BTN_STYLE}>
        <BsArrowClockwise /> Refresh
      </button>
      <button className="btn-danger" onClick={onReset} disabled={busy} style={BTN_STYLE}>
        <BsTrash3 /> Reset
      </button>
    </div>
  );
}
