import React, { useState, useEffect } from 'react';
import { X, Plus, Edit3 } from 'lucide-react';
import { createPortal } from 'react-dom';
import { transactionAPI } from '../services/api';
import { useToast } from '../context/ToastContext';
import { INCOME_CATEGORIES, EXPENSE_CATEGORIES } from '../services/helpers';

const init = { type:'expense', amount:'', category:'', date:new Date().toISOString().slice(0,10), note:'' };

export default function TransactionModal({ transaction, onClose, onSuccess }) {
  const [form, setForm]       = useState(init);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors]   = useState({});
  const { toast } = useToast();
  const isEdit = !!transaction;

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  useEffect(() => {
    if (transaction) setForm({
      type:     transaction.type,
      amount:   transaction.amount,
      category: transaction.category,
      date:     new Date(transaction.date).toISOString().slice(0,10),
      note:     transaction.note || '',
    });
  }, [transaction]);

  const set = (k, v) => {
    setForm(f => ({ ...f, [k]:v }));
    setErrors(e => ({ ...e, [k]:'' }));
  };

  const validate = () => {
    const e = {};
    if (!form.amount || isNaN(form.amount) || +form.amount <= 0) e.amount   = 'Enter a valid amount';
    if (!form.category) e.category = 'Select a category';
    if (!form.date)     e.date     = 'Select a date';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      const payload = { ...form, amount: parseFloat(form.amount) };
      if (isEdit) await transactionAPI.update(transaction._id, payload);
      else        await transactionAPI.create(payload);
      toast(isEdit ? 'Updated!' : 'Added!', 'success');
      onSuccess(); onClose();
    } catch(err) {
      toast(err.response?.data?.message || 'Something went wrong', 'error');
    } finally { setLoading(false); }
  };

  const cats = form.type === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;

  // Use portal to render modal at document.body level
  // This ensures it is NEVER affected by parent margins, padding, or transforms
  return createPortal(
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        zIndex: 99999,
        background: 'rgba(0,0,0,0.7)',
        backdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: 'var(--bg2)',
          border: '1px solid var(--border)',
          borderRadius: 20,
          padding: '28px',
          width: '100%',
          maxWidth: 480,
          maxHeight: 'calc(100vh - 40px)',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 8px 48px rgba(0,0,0,0.6)',
          overflow: 'hidden',
        }}
      >
        {/* Header */}
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:24, flexShrink:0 }}>
          <h2 style={{ fontFamily:'var(--font-display)', fontSize:20, fontWeight:700, color:'var(--text)', margin:0 }}>
            {isEdit ? 'Edit Transaction' : 'New Transaction'}
          </h2>
          <button className="btn-icon" onClick={onClose}><X size={18}/></button>
        </div>

        {/* Scrollable body */}
        <div style={{ flex:1, overflowY:'auto', display:'flex', flexDirection:'column', gap:16 }}>

          {/* Type toggle */}
          <div className="toggle-group">
            <button
              className={`toggle-btn ${form.type==='expense'?'active':''}`}
              onClick={() => { set('type','expense'); set('category',''); }}
            >
              Expense
            </button>
            <button
              className={`toggle-btn ${form.type==='income'?'active':''}`}
              onClick={() => { set('type','income'); set('category',''); }}
            >
              Income
            </button>
          </div>

          {/* Amount */}
          <div className="form-group">
            <label className="label">Amount</label>
            <input
              className={`input ${errors.amount?'input-error':''}`}
              type="number" step="0.01" min="0" placeholder="0.00"
              value={form.amount}
              onChange={e => set('amount', e.target.value)}
              inputMode="decimal"
            />
            {errors.amount && <span className="error-msg">{errors.amount}</span>}
          </div>

          {/* Category */}
          <div className="form-group">
            <label className="label">Category</label>
            <select
              className={`select ${errors.category?'input-error':''}`}
              value={form.category}
              onChange={e => set('category', e.target.value)}
            >
              <option value="">Select category…</option>
              {cats.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            {errors.category && <span className="error-msg">{errors.category}</span>}
          </div>

          {/* Date */}
          <div className="form-group">
            <label className="label">Date</label>
            <input
              className={`input ${errors.date?'input-error':''}`}
              type="date"
              value={form.date}
              onChange={e => set('date', e.target.value)}
            />
            {errors.date && <span className="error-msg">{errors.date}</span>}
          </div>

          {/* Note */}
          <div className="form-group">
            <label className="label">
              Note <span style={{ color:'var(--text3)', fontWeight:400 }}>(optional)</span>
            </label>
            <textarea
              className="textarea"
              placeholder="Add a note…"
              value={form.note}
              onChange={e => set('note', e.target.value)}
              rows={2}
              style={{ resize:'none' }}
            />
          </div>

          {/* Buttons */}
          <div style={{ display:'flex', gap:10, paddingTop:4 }}>
            <button className="btn btn-ghost" style={{ flex:1 }} onClick={onClose}>
              Cancel
            </button>
            <button
              className="btn btn-primary"
              style={{ flex:1 }}
              onClick={handleSubmit}
              disabled={loading}
            >
              {loading
                ? <span className="spinner"/>
                : isEdit
                  ? <><Edit3 size={15}/> Update</>
                  : <><Plus size={15}/> Add</>
              }
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body  // renders directly on body — ignores ALL parent styles
  );
}
