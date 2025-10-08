import React from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts'
import { doSignOut } from '../../Utils/auth'


const Header = () => {
    const navigate = useNavigate()
    const { userLoggedIn } = useAuth()

    const handleLogout = async () => {
        try {
          await doSignOut();
          navigate("/login");
        } catch (err) {
          console.error("Logout error:", err);
        }
    }

    return (
        <nav>
            {userLoggedIn ?
                    <><button onClick={handleLogout} className='text-sm text-blue-600 underline'>Logout</button></>
                    :<>
                        <Link className='text-sm text-blue-600 underline' to={'/login'}>Login</Link>
                        <Link className='text-sm text-blue-600 underline' to={'/register'}>Register New Account</Link>
                    </>
            }
        </nav>
    )
}

export default Header