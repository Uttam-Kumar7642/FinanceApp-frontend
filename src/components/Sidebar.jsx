import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, ArrowLeftRight, PiggyBank, BarChart2, Settings, LogOut, Menu, X, TrendingUp } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const NAV = [
  { to:'/dashboard',    icon:LayoutDashboard, label:'Dashboard'    },
  { to:'/transactions', icon:ArrowLeftRight,  label:'Transactions' },
  { to:'/budgets',      icon:PiggyBank,       label:'Budgets'      },
  { to:'/analytics',    icon:BarChart2,       label:'Analytics'    },
  { to:'/settings',     icon:Settings,        label:'Settings'     },
];

function SidebarInner({ onClose }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const initials = user?.name?.split(' ').map(n=>n[0]).join('').toUpperCase().slice(0,2)||'U';
  const doLogout = () => { logout(); navigate('/login'); };

  return (
    <div style={{ display:'flex', flexDirection:'column', height:'100%', overflow:'hidden' }}>
      <div style={{ padding:'20px 18px 16px', borderBottom:'1px solid var(--border)', flexShrink:0 }}>
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          <div style={{ width:34,height:34,background:'var(--accent)',borderRadius:10,display:'flex',alignItems:'center',justifyContent:'center',boxShadow:'0 0 16px var(--accent-glow)',flexShrink:0 }}>
            <TrendingUp size={18} color="#fff"/>
          </div>
          <div>
            <div style={{ fontFamily:'var(--font-display)',fontWeight:800,fontSize:16,letterSpacing:'-0.02em' }}>FinanceApp</div>
            <div style={{ fontSize:10,color:'var(--text3)',marginTop:1 }}>Money Intelligence</div>
          </div>
        </div>
      </div>

      <nav style={{ flex:1,padding:'12px 10px',display:'flex',flexDirection:'column',gap:2,overflowY:'auto' }}>
        {NAV.map(({ to, icon:Icon, label }) => (
          <NavLink key={to} to={to} onClick={onClose} style={({ isActive }) => ({
            display:'flex',alignItems:'center',gap:11,padding:'10px 12px',borderRadius:10,
            textDecoration:'none',fontSize:14,fontWeight:500,transition:'all 0.18s',
            color: isActive ? 'var(--text)' : 'var(--text2)',
            background: isActive ? 'var(--surface)' : 'transparent',
            borderLeft: isActive ? '3px solid var(--accent)' : '3px solid transparent',
          })}>
            <Icon size={17}/>{label}
          </NavLink>
        ))}
      </nav>

      <div style={{ padding:'12px 10px',borderTop:'1px solid var(--border)',flexShrink:0 }}>
        <div style={{ display:'flex',alignItems:'center',gap:9,padding:'9px 12px',borderRadius:10,background:'var(--bg3)',marginBottom:8 }}>
          <div style={{ width:32,height:32,borderRadius:'50%',background:'linear-gradient(135deg,var(--accent),var(--blue))',display:'flex',alignItems:'center',justifyContent:'center',fontSize:12,fontWeight:700,flexShrink:0 }}>
            {initials}
          </div>
          <div style={{ minWidth:0 }}>
            <div style={{ fontSize:13,fontWeight:600,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap' }}>{user?.name}</div>
            <div style={{ fontSize:11,color:'var(--text3)',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap' }}>{user?.email}</div>
          </div>
        </div>
        <button onClick={doLogout} className="btn btn-ghost btn-sm" style={{ width:'100%',justifyContent:'center' }}>
          <LogOut size={14}/> Sign Out
        </button>
      </div>
    </div>
  );
}

export default function Sidebar() {
  const [open, setOpen] = useState(false);
  return (
    <>
      {/* Desktop sidebar */}
      <aside className="desk-sidebar">
        <SidebarInner onClose={()=>{}} />
      </aside>

      {/* Mobile top bar */}
      <header className="mob-topbar">
        <div style={{ display:'flex',alignItems:'center',gap:9 }}>
          <div style={{ width:30,height:30,background:'var(--accent)',borderRadius:8,display:'flex',alignItems:'center',justifyContent:'center' }}>
            <TrendingUp size={16} color="#fff"/>
          </div>
          <span style={{ fontFamily:'var(--font-display)',fontWeight:800,fontSize:16 }}>FinanceApp</span>
        </div>
        <button className="btn-icon" onClick={()=>setOpen(true)}><Menu size={20}/></button>
      </header>

      {/* Mobile drawer */}
      {open && (
        <div style={{ position:'fixed',inset:0,zIndex:500 }}>
          <div style={{ position:'absolute',inset:0,background:'rgba(0,0,0,0.7)',backdropFilter:'blur(4px)' }} onClick={()=>setOpen(false)}/>
          <div style={{ position:'absolute',top:0,left:0,width:270,height:'100%',background:'var(--bg2)',borderRight:'1px solid var(--border)',animation:'slideIn 0.25s ease',display:'flex',flexDirection:'column' }}>
            <div style={{ padding:'12px 14px',borderBottom:'1px solid var(--border)',display:'flex',justifyContent:'flex-end',flexShrink:0 }}>
              <button className="btn-icon" onClick={()=>setOpen(false)}><X size={18}/></button>
            </div>
            <div style={{ flex:1,overflow:'hidden' }}>
              <SidebarInner onClose={()=>setOpen(false)}/>
            </div>
          </div>
        </div>
      )}

      {/* Bottom tab bar — mobile only */}
      <nav className="bottom-tabs">
        {NAV.map(({ to, icon:Icon, label }) => (
          <NavLink key={to} to={to} style={({ isActive }) => ({
            display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',
            gap:3,padding:'6px 4px',textDecoration:'none',flex:1,
            color: isActive ? 'var(--accent)' : 'var(--text3)',
            fontSize:10,fontWeight:500,
            borderTop: isActive ? '2px solid var(--accent)' : '2px solid transparent',
            transition:'all 0.15s',background:'var(--bg2)',
          })}>
            <Icon size={20}/><span>{label}</span>
          </NavLink>
        ))}
      </nav>

      <style>{`
        .desk-sidebar {
          position:fixed;top:0;left:0;width:var(--sidebar-w);height:100vh;
          background:var(--bg2);border-right:1px solid var(--border);
          z-index:100;display:flex;flex-direction:column;
        }
        .mob-topbar {
          display:none;position:fixed;top:0;left:0;right:0;height:60px;
          background:var(--bg2);border-bottom:1px solid var(--border);
          z-index:200;align-items:center;justify-content:space-between;padding:0 16px;
        }
        .bottom-tabs {
          display:none;position:fixed;bottom:0;left:0;right:0;
          border-top:1px solid var(--border);z-index:200;
          padding-bottom:env(safe-area-inset-bottom,0px);
        }
        @media(max-width:768px){
          .desk-sidebar { display:none !important; }
          .mob-topbar   { display:flex !important; }
          .bottom-tabs  { display:flex !important; }
        }
      `}</style>
    </>
  );
}
