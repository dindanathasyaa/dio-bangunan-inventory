import React, { useState } from 'react';
import axios from 'axios';

const Login = ({ setUser }) => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
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
            <div className="glass-panel login-form">
                <div className="logo-container">
                    <img src="/logo.jpeg" alt="Dio Bangunan Logo" className="logo-img" />
                    <p style={{marginTop: '12px', fontWeight: '500', color: 'var(--primary-color)'}}>Sistem Manajemen Inventory & DSS</p>
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
                    />
                    <input 
                        type="password" 
                        placeholder="Password" 
                        className="input-field" 
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                    />
                    <button type="submit" className="btn" style={{marginTop: '12px'}}>Login ke Dashboard</button>
                </form>
                
                <div style={{marginTop: '32px', fontSize: '0.85rem', color: 'var(--text-secondary)', textAlign: 'left', background: 'rgba(0,0,0,0.2)', padding: '16px', borderRadius: '8px'}}>
                    <p style={{fontWeight: 'bold', marginBottom: '8px', color: 'white'}}>📋 Akun Demo:</p>
                    <ul style={{listStylePosition: 'inside'}}>
                        <li><strong>owner</strong> / password</li>
                        <li><strong>manager1</strong> / password</li>
                        <li><strong>manager2</strong> / password</li>
                    </ul>
                </div>
            </div>
        </div>
    );
};

export default Login;
