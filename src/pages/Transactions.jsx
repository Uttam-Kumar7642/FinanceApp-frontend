import React, { useEffect, useState, useCallback } from 'react';
import { Plus, Search, Trash2, Edit3, ChevronLeft, ChevronRight, ArrowUpRight, ArrowDownRight, Filter } from 'lucide-react';
import { transactionAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { formatCurrency, formatDate, ALL_CATEGORIES, getMonthOptions } from '../services/helpers';
import TransactionModal from '../components/TransactionModal';

export default function Transactions() {
  const { user } = useAuth();
  const { toast } = useToast();
  const currency = user?.currency || 'USD';
  const [transactions, setTransactions] = useState([]);
  const [total, setTotal]   = useState(0);
  const [pages, setPages]   = useState(1);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing]     = useState(null);
  const [deleteId, setDeleteId]   = useState(null);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({ type:'', category:'', month:'', page:1 });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page:filters.page, limit:15 };
      if(filters.type)     params.type     = filters.type;
      if(filters.category) params.category = filters.category;
      if(filters.month) {
        const [y,m] = filters.month.split('-');
        params.startDate = new Date(y,m-1,1).toISOString();
        params.endDate   = new Date(y,m,0,23,59,59).toISOString();
      }
      const r = await transactionAPI.getAll(params);
      setTransactions(r.data.transactions);
      setTotal(r.data.total);
      setPages(r.data.pages);
    } catch { toast('Failed to load','error'); }
    finally { setLoading(false); }
  },[filters]);

  useEffect(()=>{ load(); },[load]);

  const handleDelete = async (id) => {
    try { await transactionAPI.delete(id); toast('Deleted','success'); setDeleteId(null); load(); }
    catch { toast('Failed to delete','error'); }
  };
  const setF = (k,v) => setFilters(f=>({...f,[k]:v,page:1}));
  const monthOptions = getMonthOptions(12);
  const hasFilters = filters.type || filters.month || filters.category;

  return (
    <div className="page">
      <div style={{ display:'flex',alignItems:'center',justifyContent:'space-between',gap:12,marginBottom:20,flexWrap:'wrap' }}>
        <div>
          <h1 className="page-title">Transactions</h1>
          <p style={{ color:'var(--text2)',fontSize:14,marginTop:4 }}>{total} records</p>
        </div>
        <div style={{ display:'flex',gap:8 }}>
          <button className="btn btn-ghost btn-sm" onClick={()=>setShowFilters(!showFilters)}>
            <Filter size={14}/> Filters {hasFilters && <span style={{ width:6,height:6,borderRadius:'50%',background:'var(--accent)',display:'inline-block'}}/>}
          </button>
          <button className="btn btn-primary btn-sm" onClick={()=>{ setEditing(null); setShowModal(true); }}>
            <Plus size={15}/> Add
          </button>
        </div>
      </div>

      {/* Filters panel */}
      {showFilters && (
        <div className="card mb-4" style={{ padding:14 }}>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(140px,1fr))', gap:10 }}>
            <select className="select" value={filters.type}     onChange={e=>setF('type',e.target.value)}>
              <option value="">All Types</option>
              <option value="income">Income</option>
              <option value="expense">Expense</option>
            </select>
            <select className="select" value={filters.month}    onChange={e=>setF('month',e.target.value)}>
              <option value="">All Months</option>
              {monthOptions.map(o=><option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
            <select className="select" value={filters.category} onChange={e=>setF('category',e.target.value)}>
              <option value="">All Categories</option>
              {ALL_CATEGORIES.map(c=><option key={c} value={c}>{c}</option>)}
            </select>
            {hasFilters && (
              <button className="btn btn-ghost btn-sm" onClick={()=>setFilters({type:'',category:'',month:'',page:1})}>Clear</button>
            )}
          </div>
        </div>
      )}

      <div className="card" style={{ padding:0,overflow:'hidden' }}>
        {loading ? (
          <div style={{ padding:40,display:'flex',justifyContent:'center' }}><div className="spinner spinner-lg"/></div>
        ) : transactions.length===0 ? (
          <div className="empty-state">
            <ArrowUpRight size={48}/>
            <h3>No transactions found</h3>
            <p>Add your first transaction to get started</p>
          </div>
        ) : (
          <>
            {/* Desktop table */}
            <div className="table-wrap tx-desktop">
              <table>
                <thead>
                  <tr>
                    <th>Type</th><th>Category</th><th>Note</th><th>Date</th>
                    <th style={{textAlign:'right'}}>Amount</th><th style={{width:80}}/>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map(tx=>(
                    <tr key={tx._id}>
                      <td><span className={`badge badge-${tx.type}`}>{tx.type==='income'?<ArrowUpRight size={11}/>:<ArrowDownRight size={11}/>} {tx.type}</span></td>
                      <td style={{fontWeight:500}}>{tx.category}</td>
                      <td style={{color:'var(--text2)',fontSize:13}}>{tx.note||'—'}</td>
                      <td style={{color:'var(--text2)',fontSize:13,whiteSpace:'nowrap'}}>{formatDate(tx.date)}</td>
                      <td style={{textAlign:'right',fontFamily:'var(--font-display)',fontWeight:700,color:tx.type==='income'?'var(--green)':'var(--red)',whiteSpace:'nowrap'}}>
                        {tx.type==='income'?'+':'-'}{formatCurrency(tx.amount,currency)}
                      </td>
                      <td>
                        <div style={{ display:'flex',gap:6,justifyContent:'flex-end' }}>
                          <button className="btn-icon" onClick={()=>{ setEditing(tx); setShowModal(true); }}><Edit3 size={13}/></button>
                          <button className="btn-icon" style={{color:'var(--red)'}} onClick={()=>setDeleteId(tx._id)}><Trash2 size={13}/></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile card list */}
            <div className="tx-mobile" style={{ padding:'8px 12px',display:'flex',flexDirection:'column',gap:8 }}>
              {transactions.map(tx=>(
                <div key={tx._id} style={{ background:'var(--bg3)',borderRadius:12,padding:'12px 14px',display:'flex',alignItems:'center',gap:12 }}>
                  <div style={{ width:38,height:38,borderRadius:10,background:tx.type==='income'?'var(--green-soft)':'var(--red-soft)',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0 }}>
                    {tx.type==='income'?<ArrowUpRight size={16} color="var(--green)"/>:<ArrowDownRight size={16} color="var(--red)"/>}
                  </div>
                  <div style={{ flex:1,minWidth:0 }}>
                    <div style={{ fontWeight:600,fontSize:14,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap' }}>{tx.category}</div>
                    <div style={{ fontSize:12,color:'var(--text3)',marginTop:2 }}>{formatDate(tx.date)}{tx.note ? ` · ${tx.note}` : ''}</div>
                  </div>
                  <div style={{ display:'flex',flexDirection:'column',alignItems:'flex-end',gap:6,flexShrink:0 }}>
                    <div style={{ fontFamily:'var(--font-display)',fontWeight:700,fontSize:14,color:tx.type==='income'?'var(--green)':'var(--red)' }}>
                      {tx.type==='income'?'+':'-'}{formatCurrency(tx.amount,currency)}
                    </div>
                    <div style={{ display:'flex',gap:5 }}>
                      <button className="btn-icon" style={{width:26,height:26,padding:4}} onClick={()=>{ setEditing(tx); setShowModal(true); }}><Edit3 size={12}/></button>
                      <button className="btn-icon" style={{width:26,height:26,padding:4,color:'var(--red)'}} onClick={()=>setDeleteId(tx._id)}><Trash2 size={12}/></button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {pages>1 && (
              <div style={{ display:'flex',alignItems:'center',justifyContent:'center',gap:12,padding:'14px 16px',borderTop:'1px solid var(--border)' }}>
                <button className="btn-icon" disabled={filters.page<=1}   onClick={()=>setFilters(f=>({...f,page:f.page-1}))}><ChevronLeft size={16}/></button>
                <span style={{ fontSize:14,color:'var(--text2)' }}>Page {filters.page} of {pages}</span>
                <button className="btn-icon" disabled={filters.page>=pages} onClick={()=>setFilters(f=>({...f,page:f.page+1}))}><ChevronRight size={16}/></button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Delete confirm */}
      {deleteId && (
        <div className="modal-overlay">
          <div className="modal" style={{maxWidth:360}}>
            <h2 className="modal-title" style={{marginBottom:12}}>Delete Transaction?</h2>
            <p style={{color:'var(--text2)',fontSize:14,marginBottom:22}}>This action cannot be undone.</p>
            <div style={{display:'flex',gap:10}}>
              <button className="btn btn-ghost" style={{flex:1}} onClick={()=>setDeleteId(null)}>Cancel</button>
              <button className="btn btn-danger" style={{flex:1}} onClick={()=>handleDelete(deleteId)}>Delete</button>
            </div>
          </div>
        </div>
      )}

      {showModal && <TransactionModal transaction={editing} onClose={()=>{ setShowModal(false); setEditing(null); }} onSuccess={load}/>}

      <style>{`
        .tx-desktop{ display:block; }
        .tx-mobile { display:none;  }
        @media(max-width:640px){
          .tx-desktop{ display:none;  }
          .tx-mobile { display:flex;  }
        }
      `}</style>
    </div>
  );
}
