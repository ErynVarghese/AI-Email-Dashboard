import React, { useEffect, useRef, useState } from "react";
import "../styles/email-dashboard.css";
import { GridStack } from "gridstack";

const API = "http://localhost:8000";

type EmailItem = {
  id: string;
  subject: string;
  from?: string;
  receivedDateTime?: string;
  label: "spam" | "ham";
  score?: number;
  bodyPreview?: string;
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
  const [error, setError] = useState<string | null>(null);
  const [selectedEmail, setSelectedEmail] = useState<EmailItem | null>(null);
  const autoIntervalRef = React.useRef<NodeJS.Timeout | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API}/api/emails/recent?label=spam&limit=20`, { credentials: "include" });
      if (!res.ok) {
        if (res.status === 401) {
          setError("Unauthorized. Please sign in again.");
          return;
        }
        throw new Error(`HTTP ${res.status}`);
      }
      const data = (await res.json()) as EmailItem[];
      
      // Filter out dismissed emails from localStorage
      const dismissedEmails = JSON.parse(localStorage.getItem('dismissedEmails') || '[]');
      const filteredData = data.filter(email => !dismissedEmails.includes(email.id));
      
      filteredData.sort(
        (a, b) =>
          (b.score ?? 0) - (a.score ?? 0) ||
          +new Date(b.receivedDateTime ?? 0) - +new Date(a.receivedDateTime ?? 0)
      );
      setRows(filteredData);
    } catch (err) {
      console.error("Failed to load emails:", err);
      setError("Failed to load emails. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);
  
  useEffect(() => {
    if (!auto) {
      if (autoIntervalRef.current) {
        clearInterval(autoIntervalRef.current);
        autoIntervalRef.current = null;
      }
      return;
    }
    // Auto-refresh every 30 seconds
    autoIntervalRef.current = setInterval(load, 30000);
    return () => {
      if (autoIntervalRef.current) {
        clearInterval(autoIntervalRef.current);
        autoIntervalRef.current = null;
      }
    };
  }, [auto]);

  return (
    <>
      <WidgetFrame
        title="Recent Spam Detections"
        right={
          <div className="actions">
            <label className="toggle">
              <input type="checkbox" checked={auto} onChange={(e) => setAuto(e.target.checked)} /> Auto-refresh
            </label>
            <button className="btn" onClick={load} disabled={loading} title="Refresh data immediately">
              {loading ? "Loading…" : "Refresh"}
            </button>
          </div>
        }
      >
        <div className="table-wrap">
          {error && (
            <div style={{ 
              padding: "12px", 
              marginBottom: "12px",
              background: "rgba(240, 84, 84, 0.1)",
              border: "1px solid var(--danger)",
              borderRadius: "6px",
              color: "var(--danger)",
              fontSize: "13px"
            }}>
              {error}
            </div>
          )}

          
          {loading && (
            <div style={{
              textAlign: "center",
              padding: "40px 20px",
              color: "var(--muted)"
            }}>
              <p>Loading emails…</p>
            </div>
          )}
          {!loading && rows.length === 0 && !error && (
            <div style={{
              textAlign: "center",
              padding: "40px 20px",
              color: "var(--muted)"
            }}>
              <p>No spam detected in the latest fetch.</p>
            </div>
          )}
          {!loading && rows.length > 0 &&  (
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
                        <button className="btn btn-small btn-outline" onClick={() => setSelectedEmail(m)}>Open</button>
                        <button className="btn btn-small btn-danger" onClick={() => markNotSpam(m.id, rows, setRows)}>Not spam</button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </WidgetFrame>
      {selectedEmail && (
        <EmailModal email={selectedEmail} onClose={() => setSelectedEmail(null)} />
      )}
    </>
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

function openOutlook(email: EmailItem) { 
  console.log("openOutlook", email); 
}

function markNotSpam(id: string, rows: EmailItem[], setRows: React.Dispatch<React.SetStateAction<EmailItem[]>>) { 
  // Remove the email from the UI immediately
  setRows(rows.filter(row => row.id !== id));
  
  // Persist dismissed email ID in localStorage
  const dismissedEmails = JSON.parse(localStorage.getItem('dismissedEmails') || '[]');
  if (!dismissedEmails.includes(id)) {
    dismissedEmails.push(id);
    localStorage.setItem('dismissedEmails', JSON.stringify(dismissedEmails));
  }
}

function EmailModal({ email, onClose }: { email: EmailItem; onClose: () => void }) {
  const spamScore = email.score != null ? (email.score * 100).toFixed(1) : "N/A";
  const scoreStatus = email.score && email.score >= 0.9 ? "High" : email.score && email.score >= 0.75 ? "Medium" : "Low";

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">Email Details</h2>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body">
          <div className="email-detail">
            <div className="detail-row">
              <span className="detail-label">From:</span>
              <span className="detail-value">{email.from || "Unknown"}</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Subject:</span>
              <span className="detail-value">{email.subject || "No subject"}</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Received:</span>
              <span className="detail-value">{fmtDate(email.receivedDateTime)}</span>
            </div>
            <div className="detail-divider" />
            <div className="detail-row">
              <span className="detail-label">Score:</span>
              <span className="detail-value">
                <span className={`chip ${scoreStatus.toLowerCase()}`}>{spamScore}% ({scoreStatus})</span>
              </span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Label:</span>
              <span className="detail-value" style={{ textTransform: "capitalize" }}>
                {email.label}
              </span>
            </div>
            <div className="detail-divider" />
            <div style={{ marginTop: "16px" }}>
              <p style={{ margin: "0 0 8px 0", fontSize: "12px", color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                Preview
              </p>
              <div style={{
                background: "var(--bg)",
                border: "1px solid var(--outline)",
                borderRadius: "6px",
                padding: "12px",
                fontSize: "13px",
                lineHeight: "1.5",
                color: "var(--ink)",
                maxHeight: "200px",
                overflowY: "auto"
              }}>
              {email.bodyPreview ? (
              <div
                dangerouslySetInnerHTML={{ __html: email.bodyPreview }}
              />
              ) : (
                <p style={{ margin: 0, color: "var(--muted)" }}>
                  No preview available
                </p>
              )}
              </div>
            </div>
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
}
