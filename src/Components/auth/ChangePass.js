import React, { useState } from "react";
import { sendPasswordResetEmail, getAuth } from "firebase/auth";
import "./ChangePass.css";

const ResetPassword = () => {
  const [email, setEmail] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const handleReset = async (e) => {
    e.preventDefault();
    setIsSending(true);
    setMessage("");
    setError("");



    const auth = getAuth();
    
    try {
      await sendPasswordResetEmail(auth, email, {
        url: `${window.location.origin}/login`, 
        handleCodeInApp: true,
      });
      setMessage("If the email is corect the message was sent for password reset! Check inbox.");
    } catch (err) {
      console.error("Reset error:", err);
      switch (err.code) {
        case "auth/invalid-email":
          setError("Please enter a valid email address.");
          break;
        case "auth/user-not-found":
          setError("No user found with this email.");
          break;
        case "auth/network-request-failed":
          setError("Network error. Please try again later.");
          break;
        default:
          setError("Something went wrong. Please try again.");
      }
    } finally {
      setIsSending(false);
    }
  };

  return (
    <main className="reset-container">
      <div className="reset-card">
        <h2 className="reset-title">Password Reset</h2>
        <p className="reset-subtitle">
          Enter your email address.
        </p>

        <form onSubmit={handleReset} className="reset-form">
          <label htmlFor="email" className="reset-label">Email Address</label>
          <input
            type="email"
            id="email"
            className="reset-input"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            disabled={isSending}
          />

          {error && <p className="reset-error">{error}</p>}
          {message && <p className="reset-success">{message}</p>}

          <button
            type="submit"
            className="reset-button"
            disabled={isSending}
          >
            {isSending ? "Sending..." : "Send Reset Email"}
          </button>
        </form>

        <div className="reset-footer">
          <a href="/login" className="reset-link">Back to Login</a>
        </div>
      </div>
    </main>
  );
};

export default ResetPassword;
