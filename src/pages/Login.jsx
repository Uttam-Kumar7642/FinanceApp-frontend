import React, { useReducer, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { TrendingUp, Eye, EyeOff, ArrowRight, AlertCircle, XCircle } from 'lucide-react';
import axios from 'axios';

const BACKEND = 'https://financeapp-backend-xwai.onrender.com';

const init = { email:'', password:'', showPass:false, loading:false, error:'' };

function reducer(state, action) {
  switch(action.type) {
    case 'SET_FIELD':   return { ...state, [action.field]: action.value };
    case 'SET_LOADING': return { ...state, loading: action.value };
    case 'SET_ERROR':   return { ...state, loading: false, error: action.value };
    case 'CLEAR_ERROR': return { ...state, error: '' };
    case 'TOGGLE_PASS': return { ...state, showPass: !state.showPass };
    default:            return state;
  }
}

export default function Login() {
  const [state, dispatch] = useReducer(reducer, init);
  const navigate          = useRef(useNavigate()).current;
  const { email, password, showPass, loading, error } = state;

  const handleSubmit = async (ev) => {
    ev?.preventDefault();

    if (!email.trim())                        { dispatch({ type:'SET_ERROR', value:'Please enter your email address.'    }); return; }
    if (!/^\S+@\S+\.\S+$/.test(email))       { dispatch({ type:'SET_ERROR', value:'Please enter a valid email address.' }); return; }
    if (!password)                            { dispatch({ type:'SET_ERROR', value:'Please enter your password.'         }); return; }

    dispatch({ type:'SET_LOADING', value:true });

    try {
      const res = await axios.post(`${BACKEND}/api/auth/login`, { email, password });
      const { token, ...userData } = res.data;
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(userData));
      navigate('/dashboard', { replace:true });
      window.location.reload();
    } catch(err) {
      const status = err?.response?.status;
      const msg    = err?.response?.data?.message || '';
      if (status === 401 || msg.toLowerCase().includes('invalid') || msg.toLowerCase().includes('password')) {
        dispatch({ type:'SET_ERROR', value:'❌ Incorrect email or password. Please try again.' });
      } else if (status === 400) {
        dispatch({ type:'SET_ERROR', value: msg || 'Please check your details and try again.' });
      } else if (!err.response) {
        dispatch({ type:'SET_ERROR', value:'Cannot connect to server. Please wait 30 seconds and try again — the server may be waking up.' });
      } else {
        dispatch({ type:'SET_ERROR', value: msg || 'Something went wrong. Please try again.' });
      }
    }
  };

  return (
    <div style={{ minHeight:'100vh', background:'var(--bg)', display:'flex', alignItems:'center', justifyContent:'center', padding:16 }}>
      <div style={{ position:'fixed', top:'20%', left:'10%', width:400, height:400, background:'radial-gradient(circle, rgba(108,99,255,0.12) 0%, transparent 70%)', pointerEvents:'none' }}/>
      <div style={{ position:'fixed', bottom:'20%', right:'10%', width:300, height:300, background:'radial-gradient(circle, rgba(34,201,122,0.08) 0%, transparent 70%)', pointerEvents:'none' }}/>

      <div style={{ width:'100%', maxWidth:420, animation:'fadeIn 0.4s ease' }}>
        <div style={{ textAlign:'center', marginBottom:32 }}>
          <div style={{ width:52, height:52, background:'var(--accent)', borderRadius:14, display:'inline-flex', alignItems:'center', justifyContent:'center', marginBottom:14, boxShadow:'0 0 32px var(--accent-glow)' }}>
            <TrendingUp size={26} color="#fff"/>
          </div>
          <h1 style={{ fontFamily:'var(--font-display)', fontSize:30, fontWeight:800, letterSpacing:'-0.03em', marginBottom:6 }}>FinanceOS</h1>
          <p style={{ color:'var(--text2)', fontSize:14 }}>Your smart money companion</p>
        </div>

        <div style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:20, padding:'32px 28px', boxShadow:'var(--shadow-lg)' }}>
          <h2 style={{ fontFamily:'var(--font-display)', fontSize:20, fontWeight:700, marginBottom:22 }}>Sign In</h2>

          {error && (
            <div style={{ display:'flex', alignItems:'flex-start', gap:10, background:'rgba(255,85,105,0.13)', border:'1.5px solid rgba(255,85,105,0.5)', borderRadius:10, padding:'13px 14px', marginBottom:20 }}>
              <AlertCircle size={17} color="#ff5569" style={{ flexShrink:0, marginTop:1 }}/>
              <span style={{ fontSize:14, color:'#ff5569', lineHeight:1.6, flex:1, fontWeight:500 }}>{error}</span>
              <button onClick={() => dispatch({ type:'CLEAR_ERROR' })} style={{ background:'none', border:'none', cursor:'pointer', color:'#ff5569', padding:0, flexShrink:0, display:'flex' }}>
                <XCircle size={16}/>
              </button>
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display:'flex', flexDirection:'column', gap:16 }} noValidate>
            <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
              <label style={{ fontSize:13, fontWeight:500, color:'var(--text2)' }}>Email</label>
              <input className="input" type="email" placeholder="you@email.com"
                value={email} onChange={e => dispatch({ type:'SET_FIELD', field:'email', value:e.target.value })}
                autoComplete="email" name="email"
                style={{ borderColor: error ? 'rgba(255,85,105,0.6)' : '' }}/>
            </div>

            <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                <label style={{ fontSize:13, fontWeight:500, color:'var(--text2)' }}>Password</label>
                <Link to="/forgot-password" style={{ fontSize:12, color:'var(--accent)', textDecoration:'none' }}>Forgot password?</Link>
              </div>
              <div style={{ position:'relative' }}>
                <input className="input" type={showPass ? 'text' : 'password'} placeholder="••••••••"
                  value={password} onChange={e => dispatch({ type:'SET_FIELD', field:'password', value:e.target.value })}
                  autoComplete="current-password" name="password"
                  style={{ paddingRight:44, borderColor: error ? 'rgba(255,85,105,0.6)' : '' }}/>
                <button type="button" onClick={() => dispatch({ type:'TOGGLE_PASS' })}
                  style={{ position:'absolute', right:12, top:'50%', transform:'translateY(-50%)', background:'none', border:'none', color:'var(--text3)', cursor:'pointer', padding:2 }}>
                  {showPass ? <EyeOff size={16}/> : <Eye size={16}/>}
                </button>
              </div>
            </div>

            <button type="submit" className="btn btn-primary"
              style={{ width:'100%', justifyContent:'center', padding:12, marginTop:4 }}
              disabled={loading}>
              {loading ? <><span className="spinner"/> Signing in…</> : <>Sign In <ArrowRight size={16}/></>}
            </button>

            <p style={{ textAlign:'center', fontSize:14, color:'var(--text2)' }}>
              Don't have an account?{' '}
              <Link to="/register" style={{ color:'var(--accent)', textDecoration:'none', fontWeight:500 }}>Sign up</Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
