import React, { useEffect, useRef, useState, useCallback } from "react";

import { GridStack } from "gridstack";
import "gridstack/dist/gridstack.min.css";
import "../styles/email-dashboard.css";

const API = "http://localhost:8000";

type EmailItem = {
  id: string;
  subject: string;
  from?: string;
  receivedDateTime?: string;
  label: "spam" | "ham";
  score?: number;
};

const fmtDate = (iso?: string) => (iso ? new Date(iso).toLocaleString() : "—");

export default function EmailSpamDashboard() {
  const gridRef = useRef<HTMLDivElement>(null);

useEffect(() => {
  const el = gridRef.current;
  if (!el) return;

  const grid = GridStack.init(
    {
      column: 12,
      cellHeight: 140,
      margin: 8,
      float: true,
      animate: true,
      draggable: { handle: ".widget-header" },
      resizable: { handles: "all" },
    },
    el
  );

  
  return () => {
    grid.destroy(false);        
  };
}, []);


  return (
    <div className="page">
      <header className="topbar"><h1>AI Email Dashboard</h1></header>
      <div className="grid-stack" ref={gridRef}>
        <div className="grid-stack-item" {...{ "gs-w": "12", "gs-h": "5", "gs-x": "0", "gs-y": "0" }}>
          <div className="grid-stack-item-content">
            <RecentSpamWidget />
          </div>
        </div>
      </div>
    </div>
  );
}

function RecentSpamWidget() {
  const [rows, setRows] = useState<EmailItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [auto, setAuto] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API}/api/emails/recent?label=spam&limit=20`, { credentials: "include" });
      if (!res.ok) throw new Error("fetch failed");
      const data = (await res.json()) as EmailItem[];
      data.sort(
        (a, b) =>
          (b.score ?? 0) - (a.score ?? 0) ||
          +new Date(b.receivedDateTime ?? 0) - +new Date(a.receivedDateTime ?? 0)
      );
      setRows(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);
  useEffect(() => {
    if (!auto) return;
    const t = setInterval(load, 30000);
    return () => clearInterval(t);
  }, [auto]);

  return (
    <WidgetFrame
      title="Recent Spam Detections"
      right={
        <div className="actions">
          <label className="toggle">
            <input type="checkbox" checked={auto} onChange={(e) => setAuto(e.target.checked)} /> Auto-refresh
          </label>
          <button className="btn" onClick={load} disabled={loading}>
            {loading ? "Loading…" : "Refresh"}
          </button>
        </div>
      }
    >
      <div className="table-wrap">
        <table className="tbl">
          <thead>
            <tr>
              <th style={{ width: "28%" }}>From</th>
              <th>Subject</th>
              <th style={{ width: "10%" }}>Score</th>
              <th style={{ width: "18%" }}>Received</th>
              <th style={{ width: "12%" }} />
            </tr>
          </thead>
          <tbody>
            {rows.map((m) => {
              const pct = m.score != null ? (m.score * 100).toFixed(1) + "%" : "—";
              const high = (m.score ?? 0) >= 0.9;
              const med = !high && (m.score ?? 0) >= 0.75;
              const klass = high ? "chip high" : med ? "chip med" : "chip low";
              return (
                <tr key={m.id}>
                  <td className="mono">{m.from || "—"}</td>
                  <td className="subject">{m.subject || "—"}</td>
                  <td><span className={klass} title={String(m.score ?? "")}>{pct}</span></td>
                  <td className="mono">{fmtDate(m.receivedDateTime)}</td>
                  <td className="row-actions">
                    <button className="btn btn-small btn-outline" onClick={() => openOutlook(m.id)}>Open</button>
                    <button className="btn btn-small btn-danger" onClick={() => markNotSpam(m.id)}>Not spam</button>
                  </td>
                </tr>
              );
            })}
            {rows.length === 0 && !loading && (
              <tr>
                <td colSpan={5} style={{ textAlign: "center", color: "var(--muted)", padding: 14 }}>
                  No spam detected in the latest fetch.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </WidgetFrame>
  );
}

function WidgetFrame({ title, right, children }:{
  title: string; right?: React.ReactNode; children: React.ReactNode;
}) {
  return (
    <div className="widget">
      <div className="widget-header">
        <h3 className="widget-title">{title}</h3>
        <div className="widget-actions">{right}</div>
      </div>
      <div className="widget-body">{children}</div>
    </div>
  );
}

function openOutlook(id: string) { console.log("openOutlook", id); }
async function markNotSpam(id: string) { console.log("markNotSpam", id); }
