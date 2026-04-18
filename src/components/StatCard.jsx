import React from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { formatCurrency } from '../services/helpers';

export default function StatCard({ title, amount, icon:Icon, color='var(--accent)', change, currency='USD' }) {
  const isPositive = change >= 0;
  return (
    <div className="card" style={{ position:'relative',overflow:'hidden' }}>
      <div style={{ position:'absolute',top:-20,right:-20,width:72,height:72,borderRadius:'50%',background:color,opacity:0.08 }}/>
      <div className="flex-between" style={{ marginBottom:12 }}>
        <span style={{ fontSize:12,fontWeight:500,color:'var(--text2)',lineHeight:1.3 }}>{title}</span>
        <div style={{ width:34,height:34,borderRadius:9,background:color+'1a',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0 }}>
          <Icon size={16} color={color}/>
        </div>
      </div>
      <div style={{ fontFamily:'var(--font-display)',fontSize:'clamp(16px,2vw,24px)',fontWeight:800,letterSpacing:'-0.02em',color:'var(--text)',wordBreak:'break-word' }}>
        {typeof amount === 'number' ? formatCurrency(amount,currency) : amount}
      </div>
      {change !== undefined && change !== null && (
        <div style={{ display:'flex',alignItems:'center',gap:4,marginTop:6,fontSize:11,color:isPositive?'var(--green)':'var(--red)' }}>
          {isPositive ? <TrendingUp size={11}/> : <TrendingDown size={11}/>}
          <span>{isPositive?'+':''}{change.toFixed(1)}% vs last month</span>
        </div>
      )}
    </div>
  );
}
