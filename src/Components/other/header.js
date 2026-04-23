import React from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../contexts'
import { doSignOut } from '../../Utils/auth'
import './header.css';


const Header = () => {
    const navigate = useNavigate()
    const { userLoggedIn } = useAuth()
    const location = useLocation();

    const handleLogout = async (e) => {
        e.preventDefault(); 
        try {
            await doSignOut();
            navigate("/login");
        } catch (err) {
            console.error("Logout error:", err);
        }
    }

    return (
        <nav className="em-top-header">
            <div className="em-header-left">
                <span className="em-logo-text">emotion<span style={{color: '#0a7e8b'}}>AI</span></span>
                <div className="em-header-links">
                    <Link to="/home" className={`em-nav-link ${location.pathname === '/home' ? 'active' : ''}`}>
                        ANALYSIS
                    </Link>
                    <Link to="/docs" className={`em-nav-link ${location.pathname === '/docs' ? 'active' : ''}`}>
                        DOCS
                    </Link>
                </div>
            </div>

            <div className="em-header-right">
                {userLoggedIn && (
                    <button 
                        onClick={handleLogout} 
                        className="em-logout-pill"
                    >
                        LOGOUT
                    </button>
                )}
            </div>
        </nav>
    )
}

export default Header