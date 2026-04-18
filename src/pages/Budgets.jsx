import React, { useEffect, useState } from 'react';
import { PiggyBank, Plus, Trash2, Target, AlertTriangle } from 'lucide-react';
import { budgetAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { formatCurrency, getCurrentMonth, getMonthOptions, getMonthLabel, EXPENSE_CATEGORIES } from '../services/helpers';

export default function Budgets() {
  const { user } = useAuth();
  const { toast } = useToast();
  const currency = user?.currency || 'USD';
  const [month, setMonth]         = useState(getCurrentMonth());
  const [budgetData, setBudgetData] = useState(null);
  const [loading, setLoading]     = useState(true);
  const [showForm, setShowForm]   = useState(false);
  const [form, setForm]           = useState({ totalBudget:'', categoryBudgets:[] });
  const [saving, setSaving]       = useState(false);
  const monthOptions = getMonthOptions(12);

  const load = async () => {
    setLoading(true);
    try {
      const r = await budgetAPI.getByMonth(month);
      setBudgetData(r.data);
      setForm({ totalBudget:r.data.budget.totalBudget, categoryBudgets:r.data.budget.categoryBudgets||[] });
    } catch(e) {
      if(e.response?.status===404){ setBudgetData(null); setForm({ totalBudget:'', categoryBudgets:[] }); }
    }
    setLoading(false);
  };
  useEffect(()=>{ load(); },[month]);

  const addCat    = () => setForm(f=>({...f,categoryBudgets:[...f.categoryBudgets,{category:'',amount:''}]}));
  const removeCat = i  => setForm(f=>({...f,categoryBudgets:f.categoryBudgets.filter((_,idx)=>idx!==i)}));
  const updateCat = (i,k,v) => setForm(f=>({...f,categoryBudgets:f.categoryBudgets.map((c,idx)=>idx===i?{...c,[k]:v}:c)}));

  const handleSave = async () => {
    if(!form.totalBudget||+form.totalBudget<=0) return toast('Enter a total budget','error');
    setSaving(true);
    try {
      await budgetAPI.save({ month, totalBudget:+form.totalBudget, categoryBudgets:form.categoryBudgets.filter(c=>c.category&&+c.amount>0).map(c=>({...c,amount:+c.amount})) });
      toast('Budget saved!','success'); setShowForm(false); load();
    } catch { toast('Failed to save','error'); }
    finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if(!budgetData?.budget?._id) return;
    try { await budgetAPI.delete(budgetData.budget._id); toast('Deleted','success'); setBudgetData(null); }
    catch { toast('Failed','error'); }
  };

  const totalSpent  = budgetData?.totalSpent || 0;
  const totalBudget = budgetData?.budget?.totalBudget || 0;
  const pct  = totalBudget ? Math.min((totalSpent/totalBudget)*100,100) : 0;
  const over = totalSpent > totalBudget && totalBudget > 0;

  return (
    <div className="page">
      <div style={{ display:'flex',alignItems:'flex-start',justifyContent:'space-between',gap:12,marginBottom:24,flexWrap:'wrap' }}>
        <div>
          <h1 className="page-title">Budgets</h1>
          <p style={{ color:'var(--text2)',fontSize:14,marginTop:4 }}>Track your spending limits</p>
        </div>
        <div style={{ display:'flex',gap:8,flexWrap:'wrap' }}>
          <select className="select" value={month} onChange={e=>setMonth(e.target.value)} style={{ minWidth:160 }}>
            {monthOptions.map(o=><option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
          <button className="btn btn-primary btn-sm" onClick={()=>setShowForm(true)}>
            <Plus size={15}/> {budgetData?'Edit':'Set'} Budget
          </button>
        </div>
      </div>

      {loading ? (
        <div style={{ display:'flex',flexDirection:'column',gap:14 }}>
          {[0,1,2].map(i=><div key={i} className="skeleton" style={{height:80}}/>)}
        </div>
      ) : !budgetData ? (
        <div className="card">
          <div className="empty-state">
            <PiggyBank size={52}/>
            <h3>No budget for {getMonthLabel(month)}</h3>
            <p>Set a budget to track spending against goals</p>
            <button className="btn btn-primary" style={{marginTop:16}} onClick={()=>setShowForm(true)}><Plus size={15}/> Set Budget</button>
          </div>
        </div>
      ) : (
        <>
          <div className="card mb-4">
            <div style={{ display:'flex',alignItems:'flex-start',justifyContent:'space-between',gap:12,marginBottom:16,flexWrap:'wrap' }}>
              <div>
                <h2 className="section-title">{getMonthLabel(month)}</h2>
                <p style={{ fontSize:13,color:'var(--text2)',marginTop:4 }}>
                  {over
                    ? <span style={{ color:'var(--red)',display:'flex',alignItems:'center',gap:5 }}><AlertTriangle size={13}/> Over by {formatCurrency(totalSpent-totalBudget,currency)}</span>
                    : `${formatCurrency(totalBudget-totalSpent,currency)} remaining`}
                </p>
              </div>
              <button className="btn-icon" onClick={handleDelete} style={{color:'var(--red)'}}><Trash2 size={16}/></button>
            </div>
            <div style={{ display:'flex',justifyContent:'space-between',fontSize:13,color:'var(--text2)',marginBottom:10,flexWrap:'wrap',gap:6 }}>
              <span>Spent: <strong style={{color:'var(--text)'}}>{formatCurrency(totalSpent,currency)}</strong></span>
              <span>Budget: <strong style={{color:'var(--text)'}}>{formatCurrency(totalBudget,currency)}</strong></span>
            </div>
            <div className="progress-bar" style={{height:10}}>
              <div className="progress-fill" style={{width:`${pct}%`,background:over?'var(--red)':pct>80?'var(--yellow)':'var(--green)'}}/>
            </div>
            <div style={{textAlign:'right',fontSize:12,color:'var(--text3)',marginTop:6}}>{pct.toFixed(0)}% used</div>
          </div>

          {budgetData.budget.categoryBudgets?.length>0 && (
            <div className="card">
              <h2 className="section-title mb-4">Category Budgets</h2>
              <div style={{ display:'flex',flexDirection:'column',gap:16 }}>
                {budgetData.budget.categoryBudgets.map((cb,i)=>{
                  const spent = budgetData.spending?.find(s=>s._id===cb.category)?.spent||0;
                  const p = cb.amount ? Math.min((spent/cb.amount)*100,100) : 0;
                  const isOver = spent>cb.amount;
                  return (
                    <div key={i}>
                      <div style={{ display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:7,flexWrap:'wrap',gap:4 }}>
                        <div style={{ display:'flex',alignItems:'center',gap:8 }}>
                          <div style={{ width:8,height:8,borderRadius:'50%',background:isOver?'var(--red)':p>80?'var(--yellow)':'var(--green)',flexShrink:0 }}/>
                          <span style={{ fontSize:14,fontWeight:500 }}>{cb.category}</span>
                        </div>
                        <span style={{ fontSize:13,color:isOver?'var(--red)':'var(--text2)',whiteSpace:'nowrap' }}>
                          {formatCurrency(spent,currency)} / {formatCurrency(cb.amount,currency)}
                        </span>
                      </div>
                      <div className="progress-bar">
                        <div className="progress-fill" style={{width:`${p}%`,background:isOver?'var(--red)':p>80?'var(--yellow)':'var(--accent)'}}/>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </>
      )}

      {showForm && (
        <div className="modal-overlay" onClick={e=>e.target===e.currentTarget&&setShowForm(false)}>
          <div className="modal">
            <div className="modal-header">
              <h2 className="modal-title">Budget — {getMonthLabel(month)}</h2>
              <button className="btn-icon" onClick={()=>setShowForm(false)}>✕</button>
            </div>
            <div style={{ display:'flex',flexDirection:'column',gap:16 }}>
              <div className="form-group">
                <label className="label">Total Monthly Budget</label>
                <input className="input" type="number" min="0" step="10" placeholder="e.g. 3000" value={form.totalBudget} onChange={e=>setForm(f=>({...f,totalBudget:e.target.value}))}/>
              </div>
              <div>
                <div style={{ display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:10 }}>
                  <label className="label">Category Limits <span style={{color:'var(--text3)'}}>(optional)</span></label>
                  <button className="btn btn-ghost btn-sm" onClick={addCat}><Plus size={12}/> Add</button>
                </div>
                <div style={{ display:'flex',flexDirection:'column',gap:8 }}>
                  {form.categoryBudgets.map((cb,i)=>(
                    <div key={i} style={{ display:'flex',gap:8 }}>
                      <select className="select" value={cb.category} onChange={e=>updateCat(i,'category',e.target.value)} style={{flex:2}}>
                        <option value="">Category…</option>
                        {EXPENSE_CATEGORIES.map(c=><option key={c} value={c}>{c}</option>)}
                      </select>
                      <input className="input" type="number" min="0" placeholder="Amount" value={cb.amount} onChange={e=>updateCat(i,'amount',e.target.value)} style={{flex:1,minWidth:0}}/>
                      <button className="btn-icon" style={{color:'var(--red)',flexShrink:0}} onClick={()=>removeCat(i)}><Trash2 size={13}/></button>
                    </div>
                  ))}
                </div>
              </div>
              <div style={{ display:'flex',gap:10 }}>
                <button className="btn btn-ghost" style={{flex:1}} onClick={()=>setShowForm(false)}>Cancel</button>
                <button className="btn btn-primary" style={{flex:1}} onClick={handleSave} disabled={saving}>
                  {saving?<span className="spinner"/>:<><Target size={14}/> Save</>}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
