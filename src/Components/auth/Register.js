import React, { useState } from "react";
import { Navigate, Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts";
import { doCreateUserWithEmailAndPassword } from "../../Utils/auth";
import { getAuth } from "firebase/auth";
import "./Register.css"; 

const Register = () => {
  const navigate = useNavigate();
  const { userLoggedIn } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isRegistering, setIsRegistering] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const onSubmit = async (e) => {
    e.preventDefault();
    if (isRegistering) return;

    setIsRegistering(true);
    setErrorMessage("");

    if (password !== confirmPassword) {
      setErrorMessage("Passwords do not match.");
      setIsRegistering(false);
      return;
    }

    try {
      const userCredential = await doCreateUserWithEmailAndPassword(
        email,
        password
      );
      const user = userCredential.user;

      if (user) {
        alert(
          `Verification email sent to ${user.email}. Please verify before logging in.`
        );

        const auth = getAuth();
        await auth.signOut(); 
        navigate("/login");
      }
    } catch (err) {
      console.error("Registration error:", err);
      switch (err.code) {
        case "auth/email-already-in-use":
          setErrorMessage("This email is already registered. Try logging in.");
          break;
        case "auth/invalid-email":
          setErrorMessage("Please enter a valid email address.");
          break;
        case "auth/weak-password":
          setErrorMessage("Password should be at least 6 characters.");
          break;
        case "auth/too-many-requests":
          setErrorMessage("Too many attempts. Please wait a few minutes.");
          break;
        default:
          setErrorMessage("Something went wrong. Please try again.");
      }
    } finally {
      setIsRegistering(false);
    }
  };

  if (userLoggedIn) return <Navigate to="/login" replace />;

  return (
    <main className="register-container">
      <div className="register-card">
        <h1>Create an Account</h1>
        <br></br>
        <br></br>

        <form onSubmit={onSubmit}>
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

          <label>Confirm Password</label>
          <input
            type="password"
            required
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
          />

          {errorMessage && (
            <div className="error-message">{errorMessage}</div>
          )}

          <button type="submit" disabled={isRegistering}>
            {isRegistering ? "Creating Account..." : "Sign Up"}
          </button>
        </form>

        <p className="login-text">
          Already have an account?{" "}
          <Link to="/login" className="login-link">
            Log in
          </Link>
        </p>
      </div>
    </main>
  );
};

export default Register;
