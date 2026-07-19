import React, { useState } from 'react';
import axios from 'axios';

const Login = ({ setUser }) => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');

    const handleLogin = async (e) => {
        e.preventDefault();
        try {
            const response = await axios.post('http://localhost:5000/api/login', { username, password });
            localStorage.setItem('user', JSON.stringify(response.data));
            setUser(response.data);
        } catch (err) {
            setError('Username atau Password salah!');
        }
    };

    return (
        <div className="login-container">
            <div className="glass-panel login-form" style={{background: 'rgba(255, 255, 255, 0.15)', backdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,0.3)', boxShadow: '0 8px 32px rgba(0,0,0,0.2)'}}>
                <div className="logo-container" style={{marginBottom: '1rem'}}>
                    <img src="/logo.jpeg" alt="Dio Bangunan Logo" className="logo-img" style={{maxWidth: '220px', borderRadius: '16px'}} />
                </div>
                
                {error && <div style={{color: 'var(--danger-color)', marginBottom: '16px', background: 'rgba(239, 68, 68, 0.1)', padding: '10px', borderRadius: '8px'}}>{error}</div>}
                
                <form onSubmit={handleLogin} style={{display: 'flex', flexDirection: 'column', gap: '20px'}}>
                    <input 
                        type="text" 
                        placeholder="Username" 
                        className="input-field" 
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        required
                        style={{padding: '16px 20px', fontSize: '1.1rem'}}
                    />
                    <div style={{position: 'relative'}}>
                        <input 
                            type={showPassword ? "text" : "password"}
                            placeholder="Password" 
                            className="input-field" 
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            style={{padding: '16px 20px', fontSize: '1.1rem', width: '100%'}}
                        />
                        <button 
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            style={{position: 'absolute', right: '16px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)'}}
                        >
                            {showPassword ? (
                                /* Eye Open */
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                            ) : (
                                /* Eye Closed (Crossed) */
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>
                            )}
                        </button>
                    </div>
                    <button type="submit" className="btn" style={{marginTop: '16px', padding: '16px', fontSize: '1.2rem'}}>Login</button>
                </form>
            </div>
        </div>
    );
};

export default Login;
