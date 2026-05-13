"use client";

import { useState, useRef, useCallback } from "react";

type Deadline = {
  title: string;
  type: string;
  due_date: string | null;
  weight: number | null;
  effort_hours: number;
  notes: string | null;
};

function StarRow({ count = 5 }: { count?: number }) {
  const sizes = ["sm", "lg", "md", "lg", "sm", "md", "lg"];
  return (
    <div className="star-row">
      {Array.from({ length: count }).map((_, i) => (
        <span key={i} className={`star star-${sizes[i % sizes.length]}`} aria-hidden="true" />
      ))}
    </div>
  );
}

function TypeBadge({ type }: { type: string }) {
  const t = type.toLowerCase();
  let cls = "badge-other";
  if (t.includes("exam") || t.includes("test") || t.includes("midterm") || t.includes("final")) cls = "badge-exam";
  else if (t.includes("hw") || t.includes("homework") || t.includes("assignment")) cls = "badge-hw";
  else if (t.includes("quiz")) cls = "badge-quiz";
  else if (t.includes("project") || t.includes("presentation")) cls = "badge-project";
  return <span className={`type-badge ${cls}`}>{type}</span>;
}

export default function Home() {
  const [syllabus, setSyllabus] = useState("");
  const [deadlines, setDeadlines] = useState<Deadline[]>([]);
  const [schedule, setSchedule] = useState("");
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<"input" | "deadlines" | "schedule">("input");
  const [dragOver, setDragOver] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const [pdfLoading, setPdfLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function extractTextFromPDF(file: File): Promise<string> {
    const formData = new FormData();
    formData.append("file", file);
    const res = await fetch("/api/parse-pdf", { method: "POST", body: formData });
    const data = await res.json();
    return data.text || "";
  }

async function handleFile(file: File) {
  if (file.type === "application/pdf") {
    setFileName(file.name);
    setPdfLoading(true);
    try {
      const text = await extractTextFromPDF(file);
      setSyllabus(text);
    } catch {
      alert("Couldn't read that PDF. Try copying and pasting the text instead.");
      setFileName(null);
    } finally {
      setPdfLoading(false);
    }
  } else {
    alert("Please upload a PDF file.");
  }
}

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) await handleFile(file);
  }, []);

  const handleFileInput = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) await handleFile(file);
  };

  async function handleExtract() {
    setLoading(true);
    const res = await fetch("/api/extract", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ syllabus }),
    });
    const data = await res.json();
    setDeadlines(data.deadlines);
    setLoading(false);
    setStep("deadlines");
  }

  async function handleSchedule() {
    setLoading(true);
    const res = await fetch("/api/schedule", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ deadlines }),
    });
    const data = await res.json();
    setSchedule(data.schedule);
    setLoading(false);
    setStep("schedule");
  }

  const uniqueTypes = [...new Set(deadlines.map((d) => d.type))];

  return (
    <>
      <style>{`
        .star-row { display: flex; justify-content: center; gap: 8px; margin: 8px 0; }
        .star { display: inline-block; clip-path: polygon(50% 0%,61% 35%,98% 35%,68% 57%,79% 91%,50% 70%,21% 91%,32% 57%,2% 35%,39% 35%); }
        .star-sm  { width: 6px;  height: 6px;  background: var(--peach); }
        .star-md  { width: 8px;  height: 8px;  background: var(--mustard); }
        .star-lg  { width: 10px; height: 10px; background: var(--sky); }

        .ss-main { min-height: 100vh; padding: 48px 24px 80px; max-width: 760px; margin: 0 auto; font-family: 'DM Sans', Georgia, sans-serif; }
        .ss-header { text-align: center; margin-bottom: 48px; }
        .ss-logo { font-family: 'DM Serif Display', Georgia, serif; font-size: 2.6rem; color: var(--forest); letter-spacing: -1px; line-height: 1; margin: 10px 0 6px; }
        .ss-logo span { color: var(--peach); }
        .ss-tagline { color: var(--fern); font-size: 0.95rem; margin-top: 4px; }

        .ss-card { background: white; border-radius: 20px; border: 1.5px solid var(--lime); padding: 28px; margin-bottom: 20px; }
        .ss-label { display: block; font-size: 0.78rem; font-weight: 600; color: var(--forest); letter-spacing: 0.06em; text-transform: uppercase; margin-bottom: 12px; }

        .ss-divider { display: flex; align-items: center; gap: 12px; margin: 20px 0; color: var(--fern); font-size: 0.82rem; }
        .ss-divider::before, .ss-divider::after { content: ''; flex: 1; height: 1px; background: var(--lime); }

        .drop-zone { border: 2px dashed var(--fern); border-radius: 16px; padding: 32px 20px; text-align: center; cursor: pointer; transition: background 0.2s, border-color 0.2s; background: var(--cream); }
        .drop-zone:hover, .drop-zone.drag-over { background: #eef5e6; border-color: var(--forest); }
        .drop-zone-icon { font-size: 2rem; margin-bottom: 10px; }
        .drop-zone-text { color: var(--forest); font-size: 0.95rem; font-weight: 500; }
        .drop-zone-sub { color: var(--fern); font-size: 0.82rem; margin-top: 4px; }
        .drop-zone-file { display: inline-flex; align-items: center; gap: 6px; margin-top: 10px; padding: 4px 12px; background: var(--lime); border-radius: 999px; font-size: 0.82rem; color: var(--forest); font-weight: 500; }

        .ss-textarea { width: 100%; padding: 16px; border-radius: 14px; border: 1.5px solid #ddd; background: var(--cream); font-family: Georgia, serif; font-size: 0.9rem; color: var(--dark); resize: vertical; outline: none; box-sizing: border-box; transition: border-color 0.2s; line-height: 1.6; }
        .ss-textarea:focus { border-color: var(--fern); }

        .ss-btn { display: inline-flex; align-items: center; gap: 8px; padding: 13px 30px; border: none; border-radius: 999px; font-family: 'DM Sans', Georgia, sans-serif; font-size: 0.95rem; font-weight: 500; cursor: pointer; transition: opacity 0.2s, transform 0.1s; }
        .ss-btn:active { transform: scale(0.97); }
        .ss-btn:disabled { opacity: 0.45; cursor: not-allowed; }
        .ss-btn-forest { background: var(--forest); color: var(--cream); }
        .ss-btn-peach  { background: var(--peach);  color: var(--forest); }
        .ss-btn-ghost  { background: none; border: none; color: var(--fern); font-size: 0.88rem; cursor: pointer; text-decoration: underline; font-family: Georgia, serif; padding: 0; }

        .ss-row { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
        .ss-section-title { font-family: 'DM Serif Display', Georgia, serif; font-size: 1.4rem; color: var(--forest); }

        .ss-pills { display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 16px; }
        .ss-pill { padding: 4px 14px; border-radius: 999px; font-size: 0.78rem; font-weight: 500; }
        .pill-count { background: var(--mustard); color: var(--forest); }
        .pill-type  { background: var(--sky); color: var(--forest); }

        .ss-table-wrap { overflow-x: auto; }
        .ss-table { width: 100%; border-collapse: collapse; font-size: 0.88rem; }
        .ss-table thead tr { background: var(--forest); color: var(--cream); }
        .ss-table thead th { padding: 12px 14px; text-align: left; font-weight: 500; font-size: 0.8rem; letter-spacing: 0.05em; text-transform: uppercase; }
        .ss-table thead th:first-child { border-radius: 10px 0 0 0; }
        .ss-table thead th:last-child  { border-radius: 0 10px 0 0; }
        .ss-table tbody tr:nth-child(even) { background: #fafaf7; }
        .ss-table tbody tr:nth-child(odd)  { background: white; }
        .ss-table tbody td { padding: 11px 14px; border-bottom: 1px solid #f0ede4; color: var(--dark); }
        .ss-table tbody td:first-child { font-weight: 500; }

        .type-badge { display: inline-block; padding: 3px 10px; border-radius: 999px; font-size: 0.78rem; font-weight: 500; }
        .badge-exam    { background: #fde8e4; color: #b5453a; }
        .badge-hw      { background: #e4f0e8; color: #3a6b47; }
        .badge-quiz    { background: #e4ecf5; color: #3a5b82; }
        .badge-project { background: #f5edd9; color: #8a6020; }
        .badge-other   { background: #ede9e0; color: #5a5040; }

        .ss-schedule-box { background: white; border-radius: 16px; border: 1.5px solid var(--lime); padding: 32px; line-height: 1.85; white-space: pre-wrap; font-size: 0.93rem; color: var(--dark); }

        .ss-spinner { display: inline-block; width: 15px; height: 15px; border: 2px solid rgba(255,255,255,0.3); border-top-color: white; border-radius: 50%; animation: ss-spin 0.7s linear infinite; }
        .ss-spinner-dark { border-color: rgba(61,79,46,0.2); border-top-color: var(--forest); }
        @keyframes ss-spin { to { transform: rotate(360deg); } }
      `}</style>

      <main className="ss-main">

        <div className="ss-header">
          <StarRow count={5} />
          <h1 className="ss-logo">Sylla<span>Study</span></h1>
          <p className="ss-tagline">paste your syllabus. get a plan.</p>
          <StarRow count={5} />
        </div>

        {step === "input" && (
          <div>
            <div className="ss-card">
              <label className="ss-label">Upload your syllabus (PDF)</label>
              <div
                className={`drop-zone ${dragOver ? "drag-over" : ""}`}
                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
              >
                <div className="drop-zone-icon">✦</div>
                <div className="drop-zone-text">{pdfLoading ? "Reading your PDF... (this takes ~30s)" : "Drag & drop your PDF here"}</div>
                <div className="drop-zone-sub">or click to browse files</div>
                {fileName && <div className="drop-zone-file">📄 {fileName}</div>}
              </div>
              <input ref={fileInputRef} type="file" accept=".pdf" onChange={handleFileInput} style={{ display: "none" }} />

              <div className="ss-divider">or paste it below</div>

              <label className="ss-label">Paste your syllabus text</label>
              <textarea
                className="ss-textarea"
                value={syllabus}
                onChange={(e) => { setSyllabus(e.target.value); setFileName(null); }}
                placeholder="Copy and paste your full syllabus here..."
                rows={10}
              />
            </div>

            <button className="ss-btn ss-btn-forest" onClick={handleExtract} disabled={(!syllabus && !fileName) || loading || pdfLoading}>
              {loading ? <><span className="ss-spinner" /> Extracting...</> : <>✦ Extract deadlines</>}
            </button>
          </div>
        )}

        {step === "deadlines" && (
          <div>
            <div className="ss-row">
              <div className="ss-section-title">✦ Your deadlines</div>
              <button className="ss-btn-ghost" onClick={() => setStep("input")}>← start over</button>
            </div>
            <div className="ss-pills">
              <span className="ss-pill pill-count">{deadlines.length} deadlines found</span>
              {uniqueTypes.map((t) => <span key={t} className="ss-pill pill-type">{t}</span>)}
            </div>
            <div className="ss-card" style={{ padding: 0, overflow: "hidden" }}>
              <div className="ss-table-wrap">
                <table className="ss-table">
                  <thead>
                    <tr><th>Assignment</th><th>Type</th><th>Due date</th><th>Weight</th><th>Est. hours</th></tr>
                  </thead>
                  <tbody>
                    {deadlines.map((d, i) => (
                      <tr key={i}>
                        <td>{d.title}</td>
                        <td><TypeBadge type={d.type} /></td>
                        <td>{d.due_date ?? "—"}</td>
                        <td>{d.weight != null ? `${d.weight}%` : "—"}</td>
                        <td>{d.effort_hours}h</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            <button className="ss-btn ss-btn-peach" onClick={handleSchedule} disabled={loading} style={{ marginTop: "20px" }}>
              {loading ? <><span className="ss-spinner ss-spinner-dark" /> Building schedule...</> : <>✦ Generate study schedule →</>}
            </button>
          </div>
        )}

        {step === "schedule" && (
          <div>
            <div className="ss-row">
              <div className="ss-section-title">✦ Your study schedule</div>
              <button className="ss-btn-ghost" onClick={() => setStep("deadlines")}>← back to deadlines</button>
            </div>
            <<div className="ss-schedule-box" dangerouslySetInnerHTML={{ __html: schedule.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/\*(.*?)\*/g, '<em>$1</em>').replace(/^## (.*?)$/gm, '<h3>$1</h3>').replace(/^# (.*?)$/gm, '<h2>$1</h2>').replace(/^- /gm, '• ').replace(/\n/g, '<br/>') }} />
          </div>
        )}

      </main>
    </>
  );
}
