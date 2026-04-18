import React, { useEffect, useState } from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { DollarSign, TrendingUp, TrendingDown, Wallet, Plus, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { dashboardAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { formatCurrency, formatShortDate, CATEGORY_COLORS, percentChange } from '../services/helpers';
import StatCard from '../components/StatCard';
import TransactionModal from '../components/TransactionModal';

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const PIE_COLORS = ['#6c63ff','#22c97a','#ff5569','#38beff','#ffb347','#f472b6','#a78bfa','#fb923c'];

const CustomPieTooltip = ({ active, payload, currency }) => {
  if (!active || !payload?.length) return null;
  const p = payload[0];
  return (
    <div style={{ background:'#1c1c28', border:'1px solid #2a2a3a', borderRadius:12, padding:'10px 14px', boxShadow:'0 8px 32px rgba(0,0,0,0.5)' }}>
      <p style={{ color: p.payload.fill, fontSize:13, fontWeight:700, marginBottom:2 }}>{p.name}</p>
      <p style={{ color:'#f0f0f8', fontSize:13, fontWeight:600 }}>{formatCurrency(p.value, currency)}</p>
    </div>
  );
};

const CustomAreaTooltip = ({ active, payload, label, currency }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background:'#1c1c28', border:'1px solid #2a2a3a', borderRadius:12, padding:'10px 14px', boxShadow:'0 8px 32px rgba(0,0,0,0.5)' }}>
      <p style={{ color:'#9090aa', fontSize:12, marginBottom:6 }}>{label}</p>
      {payload.map((p,i) => (
        <p key={i} style={{ color: p.stroke, fontSize:13, fontWeight:700 }}>
          {p.name === 'income' ? 'Income' : 'Expenses'}: {formatCurrency(p.value, currency)}
        </p>
      ))}
    </div>
  );
};

export default function Dashboard() {
  const { user } = useAuth();
  const [data, setData]           = useState(null);
  const [loading, setLoading]     = useState(true);
  const [showModal, setShowModal] = useState(false);
  const currency = user?.currency || 'USD';

  const load = async () => {
    try { const r = await dashboardAPI.getOverview(); setData(r.data); }
    catch(e) { console.error(e); }
    finally   { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const chartData = React.useMemo(() => {
    if (!data?.trend) return [];
    const map = {};
    data.trend.forEach(({ _id, total }) => {
      const k = `${_id.year}-${_id.month}`;
      if (!map[k]) map[k] = { label: MONTHS[_id.month - 1], income:0, expense:0 };
      map[k][_id.type] = total;
    });
    return Object.values(map);
  }, [data?.trend]);

  const categoryData = (data?.categoryBreakdown || []).map((entry, i) => ({
    ...entry,
    fill: CATEGORY_COLORS[entry._id] || PIE_COLORS[i % PIE_COLORS.length]
  }));

  const cur  = data?.thisMonth;
  const prev = data?.lastMonth;

  if (loading) return (
    <div className="page">
      <div className="stat-grid mb-6">{[0,1,2,3].map(i => <div key={i} className="skeleton" style={{height:110}}/>)}</div>
      <div className="rg-2-1 mb-4"><div className="skeleton" style={{height:280}}/><div className="skeleton" style={{height:280}}/></div>
      <div className="skeleton" style={{height:240}}/>
    </div>
  );

  return (
    <div className="page">
      {/* Header */}
      <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:12, marginBottom:24, flexWrap:'wrap' }}>
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p style={{ color:'#9090aa', fontSize:14, marginTop:4 }}>Welcome back, {user?.name?.split(' ')[0]} 👋</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)} style={{ flexShrink:0 }}>
          <Plus size={16}/><span className="hide-xs">Add Transaction</span><span className="show-xs">Add</span>
        </button>
      </div>

      {/* Stat cards */}
      <div className="stat-grid mb-6">
        <StatCard title="Balance"      amount={cur?.balance||0}  icon={Wallet}       color="var(--accent)" currency={currency} change={percentChange(cur?.balance, prev?.balance)}/>
        <StatCard title="Income"       amount={cur?.income||0}   icon={TrendingUp}   color="var(--green)"  currency={currency} change={percentChange(cur?.income,  prev?.income)}/>
        <StatCard title="Expenses"     amount={cur?.expense||0}  icon={TrendingDown} color="var(--red)"    currency={currency} change={percentChange(cur?.expense, prev?.expense)}/>
        <StatCard title="Savings Rate" amount={cur?.income ? `${Math.max(0,((cur.income-cur.expense)/cur.income*100)).toFixed(0)}%` : '0%'} icon={DollarSign} color="var(--yellow)"/>
      </div>

      {/* Charts */}
      <div className="rg-2-1 mb-4">
        {/* Area chart */}
        <div className="card">
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:8, marginBottom:16 }}>
            <h2 className="section-title">6-Month Overview</h2>
            <div style={{ display:'flex', gap:14, fontSize:12 }}>
              <span style={{ display:'flex', alignItems:'center', gap:5 }}>
                <span style={{ width:8, height:8, borderRadius:'50%', background:'#22c97a', display:'inline-block' }}/>
                <span style={{ color:'#9090aa' }}>Income</span>
              </span>
              <span style={{ display:'flex', alignItems:'center', gap:5 }}>
                <span style={{ width:8, height:8, borderRadius:'50%', background:'#ff5569', display:'inline-block' }}/>
                <span style={{ color:'#9090aa' }}>Expenses</span>
              </span>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={210}>
            <AreaChart data={chartData} margin={{top:5, right:5, left:-20, bottom:0}}>
              <defs>
                <linearGradient id="gI" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#22c97a" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#22c97a" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="gE" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#ff5569" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#ff5569" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <XAxis dataKey="label" tick={{ fill:'#9090aa', fontSize:11 }} axisLine={false} tickLine={false}/>
              <YAxis tick={{ fill:'#5a5a75', fontSize:10 }} axisLine={false} tickLine={false} tickFormatter={v => `$${(v/1000).toFixed(0)}k`}/>
              <Tooltip content={<CustomAreaTooltip currency={currency}/>}/>
              <Area type="monotone" dataKey="income"  stroke="#22c97a" strokeWidth={2} fill="url(#gI)"/>
              <Area type="monotone" dataKey="expense" stroke="#ff5569" strokeWidth={2} fill="url(#gE)"/>
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Pie chart — Spending */}
        <div className="card">
          <h2 className="section-title" style={{ marginBottom:16 }}>Spending</h2>
          {categoryData.length ? (
            <>
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie
                    data={categoryData} dataKey="total" nameKey="_id"
                    cx="50%" cy="50%" innerRadius={42} outerRadius={72} paddingAngle={3}
                  >
                    {categoryData.map((entry, i) => (
                      <Cell key={i} fill={entry.fill} stroke="transparent"/>
                    ))}
                  </Pie>
                  <Tooltip content={<CustomPieTooltip currency={currency}/>}/>
                </PieChart>
              </ResponsiveContainer>

              {/* Colourful legend */}
              <div style={{ display:'flex', flexDirection:'column', gap:8, marginTop:12 }}>
                {categoryData.map((entry, i) => {
                  const total = categoryData.reduce((a, c) => a + c.total, 0);
                  const pct   = total ? (entry.total / total * 100).toFixed(1) : 0;
                  return (
                    <div key={i} style={{ display:'flex', alignItems:'center', gap:8 }}>
                      <div style={{ width:8, height:8, borderRadius:'50%', background:entry.fill, flexShrink:0 }}/>
                      <span style={{ fontSize:12, color:'#9090aa', flex:1, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{entry._id}</span>
                      <span style={{ fontSize:12, color:entry.fill, fontWeight:700, flexShrink:0 }}>{formatCurrency(entry.total, currency)}</span>
                      <span style={{ fontSize:11, color:'#5a5a75', flexShrink:0, minWidth:32, textAlign:'right' }}>{pct}%</span>
                    </div>
                  );
                })}
              </div>
            </>
          ) : (
            <div className="empty-state" style={{ padding:'40px 0' }}>
              <p>No spending data this month</p>
            </div>
          )}
        </div>
      </div>

      {/* Recent transactions */}
      <div className="card">
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:16 }}>
          <h2 className="section-title">Recent Transactions</h2>
          <a href="/transactions" style={{ fontSize:13, color:'#6c63ff', textDecoration:'none', display:'flex', alignItems:'center', gap:4, flexShrink:0 }}>
            View all <ArrowUpRight size={13}/>
          </a>
        </div>
        {data?.recent?.length ? data.recent.map(tx => (
          <div key={tx._id} style={{ display:'flex', alignItems:'center', gap:12, padding:'11px 0', borderBottom:'1px solid #2a2a3a' }}>
            <div style={{ width:36, height:36, borderRadius:10, background:tx.type==='income'?'rgba(34,201,122,0.12)':'rgba(255,85,105,0.12)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
              {tx.type === 'income'
                ? <ArrowUpRight  size={16} color="#22c97a"/>
                : <ArrowDownRight size={16} color="#ff5569"/>}
            </div>
            <div style={{ flex:1, minWidth:0 }}>
              <div style={{ fontSize:14, fontWeight:500, color:'#f0f0f8', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{tx.category}</div>
              <div style={{ fontSize:12, color:'#5a5a75', marginTop:1 }}>{tx.note || formatShortDate(tx.date)}</div>
            </div>
            <div style={{ fontFamily:'var(--font-display)', fontWeight:700, fontSize:14, color: tx.type==='income' ? '#22c97a' : '#ff5569', flexShrink:0 }}>
              {tx.type === 'income' ? '+' : '-'}{formatCurrency(tx.amount, currency)}
            </div>
          </div>
        )) : (
          <div className="empty-state" style={{ padding:'28px 0' }}>
            <p>No transactions yet</p>
          </div>
        )}
      </div>

      {showModal && <TransactionModal onClose={() => setShowModal(false)} onSuccess={load}/>}
      <style>{`.hide-xs{} .show-xs{display:none} @media(max-width:400px){.hide-xs{display:none}.show-xs{display:inline}}`}</style>
    </div>
  );
}
