import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { TrendingUp, Eye, EyeOff, ArrowRight, Mail, Lock, CheckCircle, RefreshCw, ArrowLeft, AlertCircle, XCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import axios from 'axios';

function AuthLayout({ children, title, subtitle }) {
  return (
    <div style={{ minHeight:'100vh', background:'var(--bg)', display:'flex', alignItems:'center', justifyContent:'center', padding:16 }}>
      <div style={{ position:'fixed', top:'20%', left:'10%', width:400, height:400, background:'radial-gradient(circle, rgba(108,99,255,0.12) 0%, transparent 70%)', pointerEvents:'none' }}/>
      <div style={{ position:'fixed', bottom:'20%', right:'10%', width:300, height:300, background:'radial-gradient(circle, rgba(34,201,122,0.08) 0%, transparent 70%)', pointerEvents:'none' }}/>
      <div style={{ width:'100%', maxWidth:420, animation:'fadeIn 0.4s ease' }}>
        <div style={{ textAlign:'center', marginBottom:32 }}>
          <div style={{ width:52, height:52, background:'var(--accent)', borderRadius:14, display:'inline-flex', alignItems:'center', justifyContent:'center', marginBottom:14, boxShadow:'0 0 32px var(--accent-glow)' }}>
            <TrendingUp size={26} color="#fff"/>
          </div>
          <h1 style={{ fontFamily:'var(--font-display)', fontSize:30, fontWeight:800, letterSpacing:'-0.03em', marginBottom:6 }}>Finance App</h1>
          <p style={{ color:'var(--text2)', fontSize:14 }}>{subtitle}</p>
        </div>
        <div style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:20, padding:'32px 28px', boxShadow:'var(--shadow-lg)' }}>
          <h2 style={{ fontFamily:'var(--font-display)', fontSize:20, fontWeight:700, marginBottom:22 }}>{title}</h2>
          {children}
        </div>
      </div>
    </div>
  );
}

/* ── Persistent error banner — never auto-dismisses ── */
function ErrorBanner({ message, onDismiss }) {
  if (!message) return null;
  return (
    <div style={{
      display:'flex', alignItems:'flex-start', gap:10,
      background:'rgba(255,85,105,0.1)',
      border:'1px solid rgba(255,85,105,0.4)',
      borderRadius:10, padding:'12px 14px', marginBottom:4,
      animation:'fadeIn 0.25s ease'
    }}>
      <AlertCircle size={16} color="#ff5569" style={{ flexShrink:0, marginTop:1 }}/>
      <span style={{ fontSize:13, color:'#ff5569', lineHeight:1.5, flex:1 }}>{message}</span>
      {onDismiss && (
        <button onClick={onDismiss} style={{ background:'none', border:'none', cursor:'pointer', color:'#ff5569', padding:0, flexShrink:0, opacity:0.7, display:'flex' }}>
          <XCircle size={15}/>
        </button>
      )}
    </div>
  );
}

/* ── Field-level error ── */
function FieldError({ message }) {
  if (!message || !message.trim()) return null;
  return (
    <span className="error-msg" style={{ display:'flex', alignItems:'center', gap:4, marginTop:4 }}>
      <AlertCircle size={11}/> {message}
    </span>
  );
}

/* ── OTP Input ── */
function OTPInput({ value, onChange, disabled }) {
  const inputs = useRef([]);
  const digits = value.split('');
  const handleKey = (i, e) => { if (e.key==='Backspace' && !digits[i] && i>0) inputs.current[i-1]?.focus(); };
  const handleChange = (i, v) => {
    const d = v.replace(/\D/g,'').slice(-1);
    const next = [...digits]; next[i] = d;
    onChange(next.join('').slice(0,6));
    if (d && i<5) inputs.current[i+1]?.focus();
  };
  const handlePaste = (e) => {
    const p = e.clipboardData.getData('text').replace(/\D/g,'').slice(0,6);
    onChange(p); inputs.current[Math.min(p.length,5)]?.focus(); e.preventDefault();
  };
  return (
    <div style={{ display:'flex', gap:8, justifyContent:'center' }}>
      {[0,1,2,3,4,5].map(i => (
        <input key={i} ref={el => inputs.current[i]=el}
          type="text" inputMode="numeric" maxLength={1}
          value={digits[i]||''} onChange={e=>handleChange(i,e.target.value)}
          onKeyDown={e=>handleKey(i,e)} onPaste={handlePaste} disabled={disabled}
          style={{
            width:46, height:54, textAlign:'center', fontSize:22, fontWeight:700,
            background: digits[i] ? 'var(--surface2)' : 'var(--bg3)',
            border:`2px solid ${digits[i] ? 'var(--accent)' : 'var(--border)'}`,
            borderRadius:12, color:'var(--text)', fontFamily:'monospace',
            outline:'none', transition:'all 0.15s', cursor:disabled?'not-allowed':'text'
          }}
        />
      ))}
    </div>
  );
}

function Countdown({ seconds, onEnd }) {
  const [left, setLeft] = useState(seconds);
  useEffect(() => {
    setLeft(seconds);
    const t = setInterval(() => setLeft(l => { if(l<=1){ clearInterval(t); onEnd?.(); return 0; } return l-1; }),1000);
    return () => clearInterval(t);
  }, [seconds]);
  const m = Math.floor(left/60), s = left%60;
  return <span style={{ color:'var(--yellow)', fontWeight:600 }}>{m}:{String(s).padStart(2,'0')}</span>;
}

/* ══════════════════════════════════════
   LOGIN
══════════════════════════════════════ */
export function Login() {
  const [form, setForm]           = useState({ email:'', password:'' });
  const [showPass, setShowPass]   = useState(false);
  const [loading, setLoading]     = useState(false);
  const [fieldErrors, setFieldErrors] = useState({ email:'', password:'' });
  const [serverError, setServerError] = useState('');
  const { login }  = useAuth();
  const { toast }  = useToast();
  const navigate   = useNavigate();

  /* Clear server error as soon as user starts typing — but DON'T auto-dismiss */
  const set = (k, v) => {
    setForm(f => ({ ...f, [k]:v }));
    setFieldErrors(e => ({ ...e, [k]:'' }));
    /* only clear server error when both fields are being actively edited */
    if (serverError && v.length > 0) setServerError('');
  };

  const validate = () => {
    const e = {};
    if (!form.email)    e.email    = 'Email is required';
    else if (!/^\S+@\S+\.\S+$/.test(form.email)) e.email = 'Enter a valid email address';
    if (!form.password) e.password = 'Password is required';
    setFieldErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (ev) => {
    ev?.preventDefault();
    setServerError('');
    if (!validate()) return;
    setLoading(true);
    try {
      await login(form.email, form.password);
      toast('Welcome back!', 'success');
      navigate('/dashboard');
    } catch(err) {
      const status = err.response?.status;
      const msg    = err.response?.data?.message || '';
      if (status === 401 || msg.toLowerCase().includes('invalid') || msg.toLowerCase().includes('password') || msg.toLowerCase().includes('incorrect')) {
        /* Persistent — stays until user corrects and resubmits */
        setServerError('Incorrect email or password. Please check and try again.');
        setFieldErrors({ email:' ', password:' ' });
      } else if (msg.toLowerCase().includes('email')) {
        setFieldErrors(e => ({ ...e, email: msg }));
      } else {
        setServerError(msg || 'Something went wrong. Please try again.');
      }
    } finally { setLoading(false); }
  };

  return (
    <AuthLayout title="Sign In" subtitle="Your smart money companion">
      <form onSubmit={handleSubmit} style={{ display:'flex', flexDirection:'column', gap:14 }} noValidate>

        {/* Persistent server error banner */}
        <ErrorBanner message={serverError} onDismiss={() => setServerError('')}/>

        <div className="form-group">
          <label className="label">Email</label>
          <input
            className={`input ${fieldErrors.email?.trim() ? 'input-error' : ''}`}
            type="email" placeholder="you@email.com"
            value={form.email} onChange={e => set('email', e.target.value)}
            autoComplete="email" name="email"
          />
          <FieldError message={fieldErrors.email}/>
        </div>

        <div className="form-group">
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:6 }}>
            <label className="label" style={{ margin:0 }}>Password</label>
            <Link to="/forgot-password" style={{ fontSize:12, color:'var(--accent)', textDecoration:'none' }}>Forgot password?</Link>
          </div>
          <div style={{ position:'relative' }}>
            <input
              className={`input ${fieldErrors.password?.trim() ? 'input-error' : ''}`}
              type={showPass ? 'text' : 'password'} placeholder="••••••••"
              value={form.password} onChange={e => set('password', e.target.value)}
              autoComplete="current-password" name="password"
              style={{ paddingRight:44 }}
            />
            <button type="button" onClick={() => setShowPass(!showPass)}
              style={{ position:'absolute', right:12, top:'50%', transform:'translateY(-50%)', background:'none', border:'none', color:'var(--text3)', cursor:'pointer', padding:2 }}>
              {showPass ? <EyeOff size={16}/> : <Eye size={16}/>}
            </button>
          </div>
          <FieldError message={fieldErrors.password}/>
        </div>

        <button type="submit" className="btn btn-primary"
          style={{ width:'100%', justifyContent:'center', padding:12, marginTop:4 }}
          disabled={loading}>
          {loading ? <span className="spinner"/> : <>Sign In <ArrowRight size={16}/></>}
        </button>

        <p style={{ textAlign:'center', fontSize:14, color:'var(--text2)' }}>
          Don't have an account?{' '}
          <Link to="/register" style={{ color:'var(--accent)', textDecoration:'none', fontWeight:500 }}>Sign up</Link>
        </p>
      </form>
    </AuthLayout>
  );
}

/* ══════════════════════════════════════
   REGISTER
══════════════════════════════════════ */
export function Register() {
  const [step, setStep]         = useState('form');
  const [form, setForm]         = useState({ name:'', email:'', password:'' });
  const [otp, setOtp]           = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading]   = useState(false);
  const [canResend, setCanResend] = useState(false);
  const [devOtp, setDevOtp]     = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const { toast }  = useToast();
  const navigate   = useNavigate();

  const set = (k, v) => {
    setForm(f => ({ ...f, [k]:v }));
    setFieldErrors(e => ({ ...e, [k]:'' }));
    if (serverError && v.length > 0) setServerError('');
  };

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = 'Name is required';
    if (!form.email)       e.email = 'Email is required';
    else if (!/^\S+@\S+\.\S+$/.test(form.email)) e.email = 'Enter a valid email address';
    if (!form.password)    e.password = 'Password is required';
    else if (form.password.length < 6) e.password = 'Password must be at least 6 characters';
    setFieldErrors(e);
    return Object.keys(e).length === 0;
  };

  const sendOTP = async () => {
    setServerError('');
    if (!validate()) return;
    setLoading(true);
    try {
      const res = await axios.post('/api/auth/send-register-otp', form);
      setStep('otp'); setCanResend(false);
      toast('OTP sent! Check your email.', 'success');
      if (res.data.devOtp) { setDevOtp(res.data.devOtp); toast(`Dev OTP: ${res.data.devOtp}`, 'info', 10000); }
    } catch(err) {
      const msg = err.response?.data?.message || err.response?.data?.errors?.[0]?.msg || 'Failed to send OTP';
      if (msg.toLowerCase().includes('email')) setFieldErrors(e => ({ ...e, email:msg }));
      else setServerError(msg);
    } finally { setLoading(false); }
  };

  const verifyOTP = async () => {
    if (otp.length !== 6) return toast('Enter the 6-digit OTP', 'error');
    setLoading(true);
    try {
      const res = await axios.post('/api/auth/verify-register-otp', { ...form, otp });
      const { token, ...userData } = res.data;
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(userData));
      setStep('done');
      setTimeout(() => navigate('/dashboard'), 1500);
    } catch(err) { toast(err.response?.data?.message || 'Invalid OTP', 'error'); }
    finally { setLoading(false); }
  };

  const resendOTP = async () => {
    setLoading(true);
    try {
      const res = await axios.post('/api/auth/resend-otp', { email:form.email, type:'register' });
      setOtp(''); setCanResend(false);
      toast('New OTP sent!', 'success');
      if (res.data.devOtp) { setDevOtp(res.data.devOtp); toast(`Dev OTP: ${res.data.devOtp}`, 'info', 10000); }
    } catch(err) { toast(err.response?.data?.message || 'Failed to resend', 'error'); }
    finally { setLoading(false); }
  };

  if (step === 'done') return (
    <AuthLayout title="All Done!" subtitle="Account verified">
      <div style={{ textAlign:'center', padding:'20px 0' }}>
        <div style={{ width:64, height:64, borderRadius:'50%', background:'var(--green-soft)', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 16px' }}>
          <CheckCircle size={32} color="var(--green)"/>
        </div>
        <h3 style={{ fontFamily:'var(--font-display)', fontSize:20, marginBottom:8 }}>Email Verified!</h3>
        <p style={{ color:'var(--text2)', fontSize:14 }}>Redirecting to your dashboard…</p>
        <div className="spinner" style={{ margin:'20px auto 0' }}/>
      </div>
    </AuthLayout>
  );

  if (step === 'otp') return (
    <AuthLayout title="Verify Email" subtitle="Check your inbox">
      <div style={{ textAlign:'center', marginBottom:24 }}>
        <div style={{ width:52, height:52, borderRadius:'50%', background:'var(--accent-glow)', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 12px', border:'2px solid var(--accent)' }}>
          <Mail size={24} color="var(--accent)"/>
        </div>
        <p style={{ fontSize:14, color:'var(--text2)', lineHeight:1.6 }}>
          We sent a 6-digit code to<br/>
          <strong style={{ color:'var(--text)' }}>{form.email}</strong>
        </p>
        {devOtp && (
          <div style={{ background:'var(--yellow-soft)', border:'1px solid var(--yellow)', borderRadius:8, padding:'8px 12px', marginTop:12, fontSize:12, color:'var(--yellow)' }}>
            🛠 Dev OTP: <strong>{devOtp}</strong>
          </div>
        )}
      </div>
      <div style={{ marginBottom:24 }}><OTPInput value={otp} onChange={setOtp} disabled={loading}/></div>
      <button className="btn btn-primary" style={{ width:'100%', justifyContent:'center', padding:12, marginBottom:16 }}
        onClick={verifyOTP} disabled={loading || otp.length!==6}>
        {loading ? <span className="spinner"/> : <><CheckCircle size={16}/> Verify & Create Account</>}
      </button>
      <div style={{ textAlign:'center', fontSize:13, color:'var(--text2)' }}>
        {canResend
          ? <button onClick={resendOTP} disabled={loading} style={{ background:'none', border:'none', color:'var(--accent)', cursor:'pointer', fontSize:13, display:'inline-flex', alignItems:'center', gap:5 }}><RefreshCw size={13}/> Resend OTP</button>
          : <span>Resend in <Countdown seconds={60} onEnd={() => setCanResend(true)}/></span>}
      </div>
      <button onClick={() => setStep('form')} style={{ background:'none', border:'none', color:'var(--text3)', cursor:'pointer', fontSize:13, display:'flex', alignItems:'center', gap:5, margin:'16px auto 0' }}>
        <ArrowLeft size={13}/> Change email
      </button>
    </AuthLayout>
  );

  return (
    <AuthLayout title="Create Account" subtitle="Start your financial journey">
      <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
        <ErrorBanner message={serverError} onDismiss={() => setServerError('')}/>

        <div className="form-group">
          <label className="label">Full Name</label>
          <input className={`input ${fieldErrors.name?'input-error':''}`}
            placeholder="John Doe" value={form.name} onChange={e => set('name', e.target.value)}
            autoComplete="name" name="name"/>
          <FieldError message={fieldErrors.name}/>
        </div>

        <div className="form-group">
          <label className="label">Email</label>
          <input className={`input ${fieldErrors.email?'input-error':''}`}
            type="email" placeholder="you@email.com" value={form.email} onChange={e => set('email', e.target.value)}
            autoComplete="email" name="email"/>
          <FieldError message={fieldErrors.email}/>
        </div>

        <div className="form-group">
          <label className="label">Password</label>
          <div style={{ position:'relative' }}>
            <input className={`input ${fieldErrors.password?'input-error':''}`}
              type={showPass?'text':'password'} placeholder="Min. 6 characters"
              value={form.password} onChange={e => set('password', e.target.value)}
              autoComplete="new-password" name="password" style={{ paddingRight:44 }}/>
            <button type="button" onClick={() => setShowPass(!showPass)}
              style={{ position:'absolute', right:12, top:'50%', transform:'translateY(-50%)', background:'none', border:'none', color:'var(--text3)', cursor:'pointer' }}>
              {showPass ? <EyeOff size={16}/> : <Eye size={16}/>}
            </button>
          </div>
          <FieldError message={fieldErrors.password}/>
          {form.password && (
            <div style={{ display:'flex', alignItems:'center', gap:4, marginTop:6 }}>
              {[1,2,3].map(n => (
                <div key={n} style={{ flex:1, height:3, borderRadius:2, background: form.password.length>=n*4 ? n===1?'#ff5569':n===2?'#ffb347':'#22c97a' : 'var(--border)', transition:'background 0.3s' }}/>
              ))}
              <span style={{ fontSize:11, color:'var(--text3)', marginLeft:4 }}>
                {form.password.length<4?'Weak':form.password.length<8?'Fair':'Strong'}
              </span>
            </div>
          )}
        </div>

        <button className="btn btn-primary" style={{ width:'100%', justifyContent:'center', padding:12, marginTop:4 }}
          onClick={sendOTP} disabled={loading}>
          {loading ? <span className="spinner"/> : <>Send Verification OTP <ArrowRight size={16}/></>}
        </button>
        <p style={{ textAlign:'center', fontSize:14, color:'var(--text2)' }}>
          Already have an account?{' '}
          <Link to="/login" style={{ color:'var(--accent)', textDecoration:'none', fontWeight:500 }}>Sign in</Link>
        </p>
      </div>
    </AuthLayout>
  );
}

/* ══════════════════════════════════════
   FORGOT PASSWORD
══════════════════════════════════════ */
export function ForgotPassword() {
  const [step, setStep]                       = useState('email');
  const [email, setEmail]                     = useState('');
  const [otp, setOtp]                         = useState('');
  const [resetToken, setResetToken]           = useState('');
  const [newPassword, setNewPassword]         = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPass, setShowPass]               = useState(false);
  const [loading, setLoading]                 = useState(false);
  const [canResend, setCanResend]             = useState(false);
  const [devOtp, setDevOtp]                   = useState('');
  const [emailError, setEmailError]           = useState('');
  const [serverError, setServerError]         = useState('');
  const { toast }  = useToast();
  const navigate   = useNavigate();

  const sendOTP = async () => {
    setEmailError(''); setServerError('');
    if (!email) return setEmailError('Email is required');
    if (!/^\S+@\S+\.\S+$/.test(email)) return setEmailError('Enter a valid email address');
    setLoading(true);
    try {
      const res = await axios.post('/api/auth/forgot-password', { email });
      setStep('otp'); setCanResend(false);
      toast('OTP sent! Check your email.', 'success');
      if (res.data.devOtp) { setDevOtp(res.data.devOtp); toast(`Dev OTP: ${res.data.devOtp}`, 'info', 10000); }
    } catch(err) { setServerError(err.response?.data?.message || 'Failed to send OTP'); }
    finally { setLoading(false); }
  };

  const verifyOTP = async () => {
    if (otp.length !== 6) return toast('Enter the 6-digit OTP', 'error');
    setLoading(true);
    try {
      const res = await axios.post('/api/auth/verify-reset-otp', { email, otp });
      setResetToken(res.data.resetToken); setStep('reset');
    } catch(err) { toast(err.response?.data?.message || 'Invalid OTP', 'error'); }
    finally { setLoading(false); }
  };

  const resetPassword = async () => {
    if (!newPassword || newPassword.length < 6) return toast('Password min 6 characters', 'error');
    if (newPassword !== confirmPassword)         return toast('Passwords do not match', 'error');
    setLoading(true);
    try {
      await axios.post('/api/auth/reset-password', { resetToken, newPassword });
      setStep('done');
      setTimeout(() => navigate('/login'), 2000);
    } catch(err) { toast(err.response?.data?.message || 'Reset failed', 'error'); }
    finally { setLoading(false); }
  };

  const resendOTP = async () => {
    setLoading(true);
    try {
      const res = await axios.post('/api/auth/resend-otp', { email, type:'forgot-password' });
      setOtp(''); setCanResend(false); toast('New OTP sent!', 'success');
      if (res.data.devOtp) { setDevOtp(res.data.devOtp); toast(`Dev OTP: ${res.data.devOtp}`, 'info', 10000); }
    } catch(err) { toast(err.response?.data?.message || 'Failed', 'error'); }
    finally { setLoading(false); }
  };

  if (step === 'done') return (
    <AuthLayout title="Password Reset!" subtitle="All done">
      <div style={{ textAlign:'center', padding:'20px 0' }}>
        <div style={{ width:64, height:64, borderRadius:'50%', background:'var(--green-soft)', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 16px' }}>
          <CheckCircle size={32} color="var(--green)"/>
        </div>
        <h3 style={{ fontFamily:'var(--font-display)', fontSize:20, marginBottom:8 }}>Password Updated!</h3>
        <p style={{ color:'var(--text2)', fontSize:14 }}>Redirecting to login…</p>
        <div className="spinner" style={{ margin:'20px auto 0' }}/>
      </div>
    </AuthLayout>
  );

  if (step === 'reset') return (
    <AuthLayout title="New Password" subtitle="Almost there">
      <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
        <div className="form-group">
          <label className="label">New Password</label>
          <div style={{ position:'relative' }}>
            <input className="input" type={showPass?'text':'password'} placeholder="Min. 6 characters"
              value={newPassword} onChange={e => setNewPassword(e.target.value)}
              autoComplete="new-password" style={{ paddingRight:44 }}/>
            <button type="button" onClick={() => setShowPass(!showPass)}
              style={{ position:'absolute', right:12, top:'50%', transform:'translateY(-50%)', background:'none', border:'none', color:'var(--text3)', cursor:'pointer' }}>
              {showPass ? <EyeOff size={16}/> : <Eye size={16}/>}
            </button>
          </div>
        </div>
        <div className="form-group">
          <label className="label">Confirm Password</label>
          <input className={`input ${confirmPassword && newPassword!==confirmPassword?'input-error':''}`}
            type="password" placeholder="Repeat password"
            value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)}
            autoComplete="new-password"/>
          {confirmPassword && newPassword !== confirmPassword && (
            <FieldError message="Passwords do not match"/>
          )}
        </div>
        <button className="btn btn-primary" style={{ width:'100%', justifyContent:'center', padding:12 }}
          onClick={resetPassword} disabled={loading}>
          {loading ? <span className="spinner"/> : <><Lock size={16}/> Reset Password</>}
        </button>
      </div>
    </AuthLayout>
  );

  if (step === 'otp') return (
    <AuthLayout title="Enter OTP" subtitle="Check your inbox">
      <div style={{ textAlign:'center', marginBottom:24 }}>
        <div style={{ width:52, height:52, borderRadius:'50%', background:'var(--accent-glow)', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 12px', border:'2px solid var(--accent)' }}>
          <Mail size={24} color="var(--accent)"/>
        </div>
        <p style={{ fontSize:14, color:'var(--text2)', lineHeight:1.6 }}>
          OTP sent to<br/><strong style={{ color:'var(--text)' }}>{email}</strong>
        </p>
        {devOtp && (
          <div style={{ background:'var(--yellow-soft)', border:'1px solid var(--yellow)', borderRadius:8, padding:'8px 12px', marginTop:12, fontSize:12, color:'var(--yellow)' }}>
            🛠 Dev OTP: <strong>{devOtp}</strong>
          </div>
        )}
      </div>
      <div style={{ marginBottom:24 }}><OTPInput value={otp} onChange={setOtp} disabled={loading}/></div>
      <button className="btn btn-primary" style={{ width:'100%', justifyContent:'center', padding:12, marginBottom:16 }}
        onClick={verifyOTP} disabled={loading || otp.length!==6}>
        {loading ? <span className="spinner"/> : <><CheckCircle size={16}/> Verify OTP</>}
      </button>
      <div style={{ textAlign:'center', fontSize:13, color:'var(--text2)' }}>
        {canResend
          ? <button onClick={resendOTP} disabled={loading} style={{ background:'none', border:'none', color:'var(--accent)', cursor:'pointer', fontSize:13, display:'inline-flex', alignItems:'center', gap:5 }}><RefreshCw size={13}/> Resend OTP</button>
          : <span>Resend in <Countdown seconds={60} onEnd={() => setCanResend(true)}/></span>}
      </div>
      <button onClick={() => setStep('email')} style={{ background:'none', border:'none', color:'var(--text3)', cursor:'pointer', fontSize:13, display:'flex', alignItems:'center', gap:5, margin:'16px auto 0' }}>
        <ArrowLeft size={13}/> Change email
      </button>
    </AuthLayout>
  );

  return (
    <AuthLayout title="Forgot Password" subtitle="We'll send you a reset code">
      <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
        <ErrorBanner message={serverError} onDismiss={() => setServerError('')}/>
        <div className="form-group">
          <label className="label">Registered Email</label>
          <input className={`input ${emailError?'input-error':''}`}
            type="email" placeholder="you@email.com"
            value={email} onChange={e => { setEmail(e.target.value); setEmailError(''); setServerError(''); }}
            autoComplete="email" name="email"
            onKeyDown={e => e.key==='Enter' && sendOTP()}/>
          <FieldError message={emailError}/>
        </div>
        <button className="btn btn-primary" style={{ width:'100%', justifyContent:'center', padding:12 }}
          onClick={sendOTP} disabled={loading}>
          {loading ? <span className="spinner"/> : <>Send OTP <ArrowRight size={16}/></>}
        </button>
        <p style={{ textAlign:'center', fontSize:14, color:'var(--text2)' }}>
          Remembered it?{' '}
          <Link to="/login" style={{ color:'var(--accent)', textDecoration:'none', fontWeight:500 }}>Sign in</Link>
        </p>
      </div>
    </AuthLayout>
  );
}

