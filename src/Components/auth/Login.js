import React, { useState } from 'react'
import { Link , useNavigate } from 'react-router-dom'
import { doSignInWithEmailAndPassword, doSignInWithGoogle } from '../../Utils/auth'
import { auth } from "../../Utils/Firebase";
import "./Login.css";


const Login = () => {

    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [isSigningIn, setIsSigningIn] = useState(false)
    const [errorMessage, setErrorMessage] = useState('')
    const navigate = useNavigate();

    const onSubmit = async (e) => {
        e.preventDefault();
        if (!isSigningIn) {
          setIsSigningIn(true);
          setErrorMessage(""); // clear old errors
      
          try {
            const userCredential = await doSignInWithEmailAndPassword(email, password);
            const user = userCredential.user;
            
            if (!user.emailVerified) {
                setErrorMessage("Please verify your email before logging in.");
                await auth.signOut();
                setIsSigningIn(false);
                return;
              }else  setErrorMessage("u are good");
            navigate("/home");
            }  catch (err) {
            console.error("Login error:", err);
      
            // Handle Firebase error code
            switch (err.code) {
              case "auth/invalid-credential":
              case "auth/wrong-password":
                setErrorMessage("Invalid email or password.");
                break;
              case "auth/user-not-found":
                setErrorMessage("No account found with this email.");
                break;
              case "auth/too-many-requests":
                setErrorMessage("Too many failed attempts. Please try again later.");
                break;
              default:
                setErrorMessage("Something went wrong. Please try again.");
            }
            setIsSigningIn(false); 
          }
        }
      };
      
      const onGoogleSignIn = async (e) => {
        e.preventDefault();
        if (!isSigningIn) {
          setIsSigningIn(true);
          setErrorMessage("");
      
          try {
            await doSignInWithGoogle();
          } catch (err) {
            console.error("Google login error:", err);
            setErrorMessage("Google sign-in failed. Please try again.");
            setIsSigningIn(false);
          }
        }
      };

      return (
        <main className="login-container">
          <div className="login-card">
            <h2 className="login-title">Welcome Back</h2>
            <form onSubmit={onSubmit} className="login-form">
              <label>Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
    
              <label>Password</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
    
              {errorMessage && <p className="error">{errorMessage}</p>}
    
              <button type="submit" disabled={isSigningIn} className="btn-primary">
                {isSigningIn ? "Signing In..." : "Sign In"}
              </button>
            </form>
    
            <p className="text-sm">
              Don’t have an account?{" "}
              <Link to="/register" className="link">Sign up</Link>
            </p>
    
            <div className="divider">
              <span>OR</span>
            </div>
    
            <button onClick={onGoogleSignIn} disabled={isSigningIn} className="btn-google">
              <img
                src="https://www.svgrepo.com/show/355037/google.svg"
                alt="Google logo"
                className="google-icon"
              />
              {isSigningIn ? "Signing In..." : "Continue with Google"}
            </button>

            <p className="text-sm">
              Did you forget your password?{" "}
              <Link to="/passreset" className="link">Change password</Link>
            </p>
          </div>
        </main>
      );
    };
    
    export default Login;