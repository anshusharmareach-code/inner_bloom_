import {
  createUserWithEmailAndPassword,
  getAuth,
  sendEmailVerification,
  signInWithEmailAndPassword
} from 'firebase/auth';
import {
  child,
  get,
  getDatabase,
  ref,
  set
} from 'firebase/database';
import { useState } from 'react';
import '../CSS/Login.css';
import { app } from './firebase';

const auth = getAuth(app);
const db = getDatabase(app);

const Login = ({
  setIsLoggedIn,
  setModalOpen,
  setModalMessage,
  setUserRole,
  setCurrentUser,
  setPendingNavigation
}) => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('user');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');

    if (isLogin) {
      try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        if (!user.emailVerified) {
          setError('Please verify your email before logging in.');
          return;
        }


        const snapshot = await get(child(ref(db), `users/${user.uid}`));
        const userData = snapshot.exists() ? snapshot.val() : { role: 'user' };

        const currentUserData = {
          uid: user.uid,
          email: user.email,
          emailVerified: user.emailVerified,
          ...userData,
        };


        setCurrentUser(currentUserData);
        setUserRole(userData.role || 'user');
        setIsLoggedIn(true);
        setModalOpen(false);


        let targetRoute = '/';
        if (userData.role === 'admin') targetRoute = '/admin';
        else if (userData.role === 'counsellor') targetRoute = '/counsellor';

        setPendingNavigation(targetRoute);
      } catch (err) {
        setError(err.message);
      }
    } else {

      try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        await sendEmailVerification(user);

        await set(ref(db, 'users/' + user.uid), {
          email: user.email,
          role: role,
          assignedCounsellor: role === 'user' ? null : null
        });

        setMessage('Signup successful! A verification link has been sent to your email.');
        setEmail('');
        setPassword('');
        setIsLogin(true);
      } catch (err) {
        setError(err.message);
      }
    }
  };

  return (
    <div className="auth-container">
      {}
      <div className="auth-header">
        <h1>💜 MindCare</h1>
        <p>Welcome to your mental wellness journey</p>
      </div>

      {}
      <div className="auth-box">
        {}
        <div className="auth-toggle">
          <button
            type="button"
            className={`toggle-btn ${isLogin ? 'active' : ''}`}
            onClick={() => {
              setIsLogin(true);
              setError('');
              setMessage('');
            }}
          >
            Login
          </button>
          <button
            type="button"
            className={`toggle-btn ${!isLogin ? 'active' : ''}`}
            onClick={() => {
              setIsLogin(false);
              setError('');
              setMessage('');
            }}
          >
            Sign Up
          </button>
        </div>

        {}
        <p className="auth-subtitle">
          {isLogin
            ? 'Sign in to access your wellness toolkit'
            : 'Create an account to begin your journey'}
        </p>

        {}
        {error && <p className="auth-error">{error}</p>}
        {message && <p className="auth-success">{message}</p>}

        {}
        <form onSubmit={handleSubmit}>
          <div className="input-group">
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
            />
          </div>

          <div className="input-group">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="********"
              required
            />
          </div>

          {}
          {!isLogin && (
            <div className="input-group role-selector">
              <label>Select Role</label>
              <div className="radio-group">
                <label htmlFor="user-role">
                  <input
                    type="radio"
                    id="user-role"
                    name="role"
                    value="user"
                    checked={role === 'user'}
                    onChange={() => setRole('user')}
                  />
                  User
                </label>

                <label htmlFor="counsellor-role">
                  <input
                    type="radio"
                    id="counsellor-role"
                    name="role"
                    value="counsellor"
                    checked={role === 'counsellor'}
                    onChange={() => setRole('counsellor')}
                  />
                  Counsellor
                </label>
              </div>
            </div>
          )}

          {}
          <button type="submit" className="auth-button">
            {isLogin ? 'Log In' : 'Create Account'}
          </button>
        </form>

        {}
        <p className="toggle-link">
          {isLogin ? "Don't have an account?" : "Already have an account?"}
          <span
            onClick={() => {
              setIsLogin(!isLogin);
              setError('');
              setMessage('');
            }}
          >
            {isLogin ? ' Sign Up here' : ' Log In here'}
          </span>
        </p>
      </div>
    </div>
  );
};

export default Login;
