import React, { useState } from 'react';
import { User, Globe, Lock, Save } from 'lucide-react';
import { authAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

const CURRENCIES = ['USD','EUR','GBP','INR','JPY','CAD','AUD','SGD','CHF','CNY'];
const TABS = [
  { id:'profile',     icon:User,  label:'Profile'     },
  { id:'preferences', icon:Globe, label:'Preferences' },
];

export default function Settings() {
  const { user, updateUser, logout } = useAuth();
  const { toast } = useToast();
  const [profile, setProfile] = useState({ name:user?.name||'', currency:user?.currency||'USD' });
  const [saving, setSaving]   = useState(false);
  const [tab, setTab]         = useState('profile');

  const saveProfile = async () => {
    if(!profile.name.trim()) return toast('Name is required','error');
    setSaving(true);
    try { const r = await authAPI.updateProfile(profile); updateUser(r.data); toast('Saved!','success'); }
    catch { toast('Failed to update','error'); }
    finally { setSaving(false); }
  };

  const initials = user?.name?.split(' ').map(n=>n[0]).join('').toUpperCase().slice(0,2)||'U';

  return (
    <div className="page">
      <div style={{ marginBottom:24 }}>
        <h1 className="page-title">Settings</h1>
        <p style={{ color:'var(--text2)',fontSize:14,marginTop:4 }}>Manage your account</p>
      </div>

      <div className="rg-sb">
        {/* Tab nav */}
        <div className="card" style={{ padding:8 }}>
          <div style={{ display:'flex',flexDirection:'column',gap:2 }} className="settings-tab-list">
            {TABS.map(({ id, icon:Icon, label })=>(
              <button key={id} onClick={()=>setTab(id)} style={{
                width:'100%',display:'flex',alignItems:'center',gap:10,padding:'10px 12px',
                borderRadius:8,border:'none',cursor:'pointer',fontFamily:'var(--font-body)',
                fontSize:14,fontWeight:500,textAlign:'left',transition:'all 0.15s',
                background: tab===id ? 'var(--surface2)' : 'transparent',
                color:      tab===id ? 'var(--text)'    : 'var(--text2)',
              }}>
                <Icon size={15}/>{label}
              </button>
            ))}
          </div>
          {/* Mobile: show as horizontal tabs */}
          <div style={{ display:'none',gap:4 }} className="settings-tab-row">
            {TABS.map(({ id, icon:Icon, label })=>(
              <button key={id} onClick={()=>setTab(id)} style={{
                flex:1,display:'flex',alignItems:'center',justifyContent:'center',gap:6,
                padding:'9px 8px',borderRadius:8,border:'none',cursor:'pointer',
                fontFamily:'var(--font-body)',fontSize:13,fontWeight:500,transition:'all 0.15s',
                background: tab===id ? 'var(--surface2)' : 'transparent',
                color:      tab===id ? 'var(--text)'    : 'var(--text2)',
              }}>
                <Icon size={14}/>{label}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="card">
          {tab==='profile' && (
            <>
              <h2 className="section-title" style={{marginBottom:20}}>Profile Information</h2>
              <div style={{ display:'flex',alignItems:'center',gap:14,marginBottom:24,padding:16,background:'var(--bg3)',borderRadius:12,flexWrap:'wrap' }}>
                <div style={{ width:56,height:56,borderRadius:'50%',background:'linear-gradient(135deg,var(--accent),var(--blue))',display:'flex',alignItems:'center',justifyContent:'center',fontSize:20,fontWeight:700,flexShrink:0 }}>
                  {initials}
                </div>
                <div style={{ minWidth:0 }}>
                  <div style={{ fontFamily:'var(--font-display)',fontWeight:700,fontSize:17,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap' }}>{user?.name}</div>
                  <div style={{ fontSize:13,color:'var(--text2)',marginTop:2,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap' }}>{user?.email}</div>
                </div>
              </div>
              <div style={{ display:'flex',flexDirection:'column',gap:14,maxWidth:420 }}>
                <div className="form-group">
                  <label className="label">Full Name</label>
                  <input className="input" value={profile.name} onChange={e=>setProfile(p=>({...p,name:e.target.value}))}/>
                </div>
                <div className="form-group">
                  <label className="label">Email</label>
                  <input className="input" value={user?.email} disabled style={{opacity:0.6,cursor:'not-allowed'}}/>
                  <span style={{fontSize:12,color:'var(--text3)'}}>Email cannot be changed</span>
                </div>
                <button className="btn btn-primary" style={{alignSelf:'flex-start'}} onClick={saveProfile} disabled={saving}>
                  {saving?<span className="spinner"/>:<><Save size={14}/> Save Changes</>}
                </button>
              </div>
            </>
          )}

          {tab==='preferences' && (
            <>
              <h2 className="section-title" style={{marginBottom:20}}>Preferences</h2>
              <div style={{ display:'flex',flexDirection:'column',gap:18,maxWidth:420 }}>
                <div className="form-group">
                  <label className="label">Currency</label>
                  <select className="select" value={profile.currency} onChange={e=>setProfile(p=>({...p,currency:e.target.value}))}>
                    {CURRENCIES.map(c=><option key={c} value={c}>{c}</option>)}
                  </select>
                  <span style={{fontSize:12,color:'var(--text3)'}}>Used for displaying all amounts</span>
                </div>
                <button className="btn btn-primary" style={{alignSelf:'flex-start'}} onClick={saveProfile} disabled={saving}>
                  {saving?<span className="spinner"/>:<><Save size={14}/> Save</>}
                </button>
                <div className="divider"/>
                <div>
                  <h3 style={{ fontFamily:'var(--font-display)',fontSize:15,fontWeight:700,marginBottom:6,color:'var(--red)' }}>Danger Zone</h3>
                  <p style={{ fontSize:13,color:'var(--text2)',marginBottom:12 }}>Sign out from this device.</p>
                  <button className="btn btn-danger" onClick={logout}><Lock size={14}/> Sign Out</button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      <style>{`
        @media(max-width:768px){
          .settings-tab-list{ display:none !important; }
          .settings-tab-row { display:flex !important; }
        }
      `}</style>
    </div>
  );
}
