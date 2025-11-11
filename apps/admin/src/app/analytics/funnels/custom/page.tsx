"use client";
import React from "react";
import { resolveApiBase } from "../../../lib/apiBase";
import { AnalyticsNav } from "../../components/AnalyticsNav";

export default function CustomFunnelsPage(): JSX.Element {
	const apiBase = React.useMemo(()=> resolveApiBase(), []);
	const [from, setFrom] = React.useState<string>(new Date(Date.now()-30*24*3600*1000).toISOString().slice(0,10));
	const [to, setTo] = React.useState<string>(new Date().toISOString().slice(0,10));
	const [stepsText, setStepsText] = React.useState<string>("page_view,add_to_cart,checkout,purchase");
	const [rows, setRows] = React.useState<Array<{ step:string; sessions:number }>>([]);
	const [busy, setBusy] = React.useState(false);
	const [err, setErr] = React.useState("");
	async function run(){
		setBusy(true); setErr("");
		try{
			const steps = stepsText.split(",").map(s=> s.trim()).filter(Boolean);
			const r = await fetch(`${apiBase}/api/admin/analytics/funnels/custom`, {
				method:"POST",
				headers:{ "content-type":"application/json" },
				credentials:"include",
				body: JSON.stringify({ steps, from, to })
			});
			const j = await r.json().catch(()=> ({}));
			if (!r.ok || !j.ok){ setErr(j.error||"failed"); setRows([]); }
			else setRows(j.funnel||[]);
		}catch(e:any){ setErr("network_error"); setRows([]); }
		finally{ setBusy(false); }
	}
	return (
		<main className="container">
			<div className="panel" style={{ padding:16 }}>
				<AnalyticsNav />
				<h1 style={{ marginTop:0 }}>منشئ المسار (مرن)</h1>
				<div style={{ display:"flex", gap:8, alignItems:"center", flexWrap:"wrap" }}>
					<label>من<input type="date" className="input" value={from} onChange={e=> setFrom(e.target.value)} /></label>
					<label>إلى<input type="date" className="input" value={to} onChange={e=> setTo(e.target.value)} /></label>
					<input className="input" style={{ minWidth:340, flex:1 }} value={stepsText} onChange={e=> setStepsText(e.target.value)} placeholder="page_view,add_to_cart,checkout,purchase" />
					<button className="btn" onClick={run} disabled={busy}>تنفيذ</button>
				</div>
				{err && <div className="error" style={{ marginTop:12 }}>{err}</div>}
				<div style={{ marginTop:12 }}>
					<table className="table"><thead><tr><th>الخطوة</th><th>الجلسات (تراكمياً)</th></tr></thead><tbody>
						{rows.map(r=> (<tr key={r.step}><td>{r.step}</td><td>{r.sessions.toLocaleString()}</td></tr>))}
						{!rows.length && !busy && (<tr><td colSpan={2} style={{ color:'var(--sub)' }}>—</td></tr>)}
					</tbody></table>
				</div>
			</div>
		</main>
	);
}


