import React, { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { transactionAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { formatCurrency, getCurrentMonth, getMonthOptions, CATEGORY_COLORS } from '../services/helpers';

const PIE_COLORS = ['#6c63ff','#22c97a','#ff5569','#38beff','#ffb347','#f472b6','#a78bfa','#fb923c','#34d399','#60a5fa','#f87171','#fbbf24'];

const CustomTooltip = ({ active, payload, label, currency }) => {
  if(!active || !payload?.length) return null;
  return (
    <div style={{ background:'#1c1c28', border:'1px solid #2a2a3a', borderRadius:12, padding:'10px 14px', boxShadow:'0 8px 32px rgba(0,0,0,0.5)' }}>
      {label && <p style={{ color:'#9090aa', fontSize:12, marginBottom:6 }}>{label}</p>}
      {payload.map((p,i) => (
        <p key={i} style={{ color: p.fill || p.color || '#f0f0f8', fontSize:13, fontWeight:700 }}>
          {p.name}: {formatCurrency(p.value, currency)}
        </p>
      ))}
    </div>
  );
};

const CustomPieTooltip = ({ active, payload, currency }) => {
  if(!active || !payload?.length) return null;
  const p = payload[0];
  return (
    <div style={{ background:'#1c1c28', border:'1px solid #2a2a3a', borderRadius:12, padding:'10px 14px', boxShadow:'0 8px 32px rgba(0,0,0,0.5)' }}>
      <p style={{ color: p.payload.fill, fontSize:13, fontWeight:700 }}>{p.name}</p>
      <p style={{ color:'#f0f0f8', fontSize:13, marginTop:2 }}>{formatCurrency(p.value, currency)}</p>
      <p style={{ color:'#9090aa', fontSize:11, marginTop:1 }}>{p.payload.percent ? (p.payload.percent * 100).toFixed(1) + '%' : ''}</p>
    </div>
  );
};

const CustomLegend = ({ payload }) => (
  <div style={{ display:'flex', flexWrap:'wrap', gap:'6px 12px', justifyContent:'center', marginTop:8 }}>
    {payload?.map((p,i) => (
      <div key={i} style={{ display:'flex', alignItems:'center', gap:5 }}>
        <div style={{ width:8, height:8, borderRadius:'50%', background:p.color, flexShrink:0 }}/>
        <span style={{ fontSize:11, color:'#9090aa' }}>{p.value}</span>
      </div>
    ))}
  </div>
);

export default function Analytics() {
  const { user } = useAuth();
  const currency = user?.currency || 'USD';
  const [month, setMonth]     = useState(getCurrentMonth());
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const monthOptions = getMonthOptions(12);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try { const r = await transactionAPI.getSummary({ month }); setSummary(r.data); }
      catch(e) { console.error(e); }
      finally   { setLoading(false); }
    };
    load();
  }, [month]);

  const income  = summary?.summary?.find(s => s._id === 'income')?.total  || 0;
  const expense = summary?.summary?.find(s => s._id === 'expense')?.total || 0;
  const savings = income - expense;
  const savingsRate = income ? ((savings / income) * 100).toFixed(1) : 0;

  const expCats = summary?.categoryBreakdown?.filter(c => c._id.type === 'expense').map(c => ({ name: c._id.category, value: c.total })) || [];
  const incCats = summary?.categoryBreakdown?.filter(c => c._id.type === 'income').map(c  => ({ name: c._id.category, value: c.total })) || [];

  const barData = [
    { name:'Income',   amount:income,             fill:'#22c97a' },
    { name:'Expenses', amount:expense,             fill:'#ff5569' },
    { name:'Savings',  amount:Math.max(0,savings), fill:'#6c63ff' },
  ];

  const expCatsColored = expCats.map((c,i) => ({ ...c, fill: CATEGORY_COLORS[c.name] || PIE_COLORS[i % PIE_COLORS.length] }));
  const incCatsColored = incCats.map((c,i) => ({ ...c, fill: CATEGORY_COLORS[c.name] || PIE_COLORS[i % PIE_COLORS.length] }));

  const statCards = [
    { label:'Total Income',  value:formatCurrency(income,currency),  color:'#22c97a', bg:'rgba(34,201,122,0.1)',  border:'rgba(34,201,122,0.25)'  },
    { label:'Total Expenses',value:formatCurrency(expense,currency), color:'#ff5569', bg:'rgba(255,85,105,0.1)',  border:'rgba(255,85,105,0.25)'  },
    { label:'Net Savings',   value:formatCurrency(savings,currency), color: savings>=0 ? '#6c63ff' : '#ff5569', bg: savings>=0 ? 'rgba(108,99,255,0.1)' : 'rgba(255,85,105,0.1)', border: savings>=0 ? 'rgba(108,99,255,0.25)' : 'rgba(255,85,105,0.25)' },
    { label:'Savings Rate',  value:`${savingsRate}%`, color:+savingsRate>=20?'#22c97a':+savingsRate>=10?'#ffb347':'#ff5569', bg:+savingsRate>=20?'rgba(34,201,122,0.1)':+savingsRate>=10?'rgba(255,179,71,0.1)':'rgba(255,85,105,0.1)', border:+savingsRate>=20?'rgba(34,201,122,0.25)':+savingsRate>=10?'rgba(255,179,71,0.25)':'rgba(255,85,105,0.25)' },
  ];

  if(loading) return (
    <div className="page">
      <div className="rg-4 mb-4">{[0,1,2,3].map(i=><div key={i} className="skeleton" style={{height:100}}/>)}</div>
      <div className="rg-2 mb-4"><div className="skeleton" style={{height:280}}/><div className="skeleton" style={{height:280}}/></div>
      <div className="rg-2"><div className="skeleton" style={{height:280}}/><div className="skeleton" style={{height:280}}/></div>
    </div>
  );

  return (
    <div className="page">
      {/* Header */}
      <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:12, marginBottom:24, flexWrap:'wrap' }}>
        <div>
          <h1 className="page-title">Analytics</h1>
          <p style={{ color:'#9090aa', fontSize:14, marginTop:4 }}>Insights into your finances</p>
        </div>
        <select className="select" value={month} onChange={e=>setMonth(e.target.value)} style={{ minWidth:180, flexShrink:0 }}>
          {monthOptions.map(o=><option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      </div>

      {/* Stat cards */}
      <div className="rg-4 mb-4">
        {statCards.map((s,i) => (
          <div key={i} style={{ background:s.bg, border:`1px solid ${s.border}`, borderRadius:16, padding:'18px 20px' }}>
            <div style={{ fontSize:12, color:'#9090aa', marginBottom:10, fontWeight:500 }}>{s.label}</div>
            <div style={{ fontFamily:'var(--font-display)', fontSize:'clamp(16px,2vw,22px)', fontWeight:800, color:s.color, wordBreak:'break-word' }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Charts row */}
      <div className="rg-2 mb-4">
        {/* Bar chart */}
        <div className="card">
          <h2 className="section-title" style={{ marginBottom:20 }}>Income vs Expenses</h2>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={barData} barSize={48} margin={{top:5,right:10,left:-10,bottom:0}}>
              <XAxis
                dataKey="name"
                tick={{ fill:'#9090aa', fontSize:13, fontWeight:500 }}
                axisLine={false} tickLine={false}
              />
              <YAxis
                tick={{ fill:'#5a5a75', fontSize:11 }}
                axisLine={false} tickLine={false}
                tickFormatter={v => `$${(v/1000).toFixed(0)}k`}
              />
              <Tooltip content={<CustomTooltip currency={currency}/>}/>
              <Bar dataKey="amount" radius={[10,10,0,0]}>
                {barData.map((entry,i) => (
                  <Cell key={i} fill={entry.fill}/>
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>

          {/* Manual legend */}
          <div style={{ display:'flex', gap:16, justifyContent:'center', marginTop:12 }}>
            {barData.map((d,i) => (
              <div key={i} style={{ display:'flex', alignItems:'center', gap:6 }}>
                <div style={{ width:10, height:10, borderRadius:3, background:d.fill }}/>
                <span style={{ fontSize:12, color:'#9090aa' }}>{d.name}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Pie chart */}
        <div className="card">
          <h2 className="section-title" style={{ marginBottom:20 }}>Expense Breakdown</h2>
          {expCatsColored.length ? (
            <>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={expCatsColored} dataKey="value" nameKey="name"
                    cx="50%" cy="50%" outerRadius={80} paddingAngle={3}
                  >
                    {expCatsColored.map((entry,i) => (
                      <Cell key={i} fill={entry.fill} stroke="transparent"/>
                    ))}
                  </Pie>
                  <Tooltip content={<CustomPieTooltip currency={currency}/>}/>
                </PieChart>
              </ResponsiveContainer>
              {/* Colourful legend below */}
              <div style={{ display:'flex', flexWrap:'wrap', gap:'6px 14px', marginTop:8 }}>
                {expCatsColored.map((c,i) => (
                  <div key={i} style={{ display:'flex', alignItems:'center', gap:5 }}>
                    <div style={{ width:8, height:8, borderRadius:'50%', background:c.fill, flexShrink:0 }}/>
                    <span style={{ fontSize:11, color:'#9090aa' }}>{c.name}</span>
                  </div>
                ))}
              </div>
            </>
          ) : <div className="empty-state" style={{padding:'40px 0'}}><p>No expense data</p></div>}
        </div>
      </div>

      {/* Category breakdown tables */}
      <div className="rg-2">
        {[
          { title:'Top Income Sources',     data:incCatsColored, color:'#22c97a' },
          { title:'Top Expense Categories', data:expCatsColored, color:'#ff5569' },
        ].map(({ title, data, color }) => (
          <div key={title} className="card">
            <h2 className="section-title" style={{ marginBottom:16 }}>{title}</h2>
            {data.length ? (
              <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
                {data.slice(0,6).map((item,i) => {
                  const total = data.reduce((a,c) => a+c.value, 0);
                  const pct   = total ? (item.value / total * 100).toFixed(1) : 0;
                  return (
                    <div key={i}>
                      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:6, gap:8 }}>
                        <div style={{ display:'flex', alignItems:'center', gap:7, flex:1, minWidth:0 }}>
                          <div style={{ width:9, height:9, borderRadius:'50%', background:item.fill, flexShrink:0 }}/>
                          <span style={{ fontSize:13, fontWeight:500, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', color:'#f0f0f8' }}>{item.name}</span>
                        </div>
                        <div style={{ display:'flex', gap:10, alignItems:'center', flexShrink:0 }}>
                          <span style={{ fontSize:12, color:'#5a5a75' }}>{pct}%</span>
                          <span style={{ fontSize:13, fontWeight:700, color:item.fill }}>{formatCurrency(item.value, currency)}</span>
                        </div>
                      </div>
                      <div style={{ height:6, background:'rgba(255,255,255,0.06)', borderRadius:3, overflow:'hidden' }}>
                        <div style={{ height:'100%', width:`${pct}%`, background:item.fill, borderRadius:3, transition:'width 0.5s ease' }}/>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : <div className="empty-state" style={{padding:'24px 0'}}><p>No data</p></div>}
          </div>
        ))}
      </div>
    </div>
  );
}
