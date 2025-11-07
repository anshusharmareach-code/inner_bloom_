import { useEffect, useState } from 'react';
import { BrowserRouter, Navigate, Route, Routes, useNavigate } from 'react-router-dom';
import Feed from './Components/Feed';
import History from './Components/History';
import Home from './Components/Home';
import Login from './Components/Login';
import NavBar from './Components/Navbar';
import ProtectedRoute from './Components/ProtectedRoute';
import ScreeningPage from './Components/Screening';
import './CSS/App.css';
import AdminPage from './Dashboard/Admin';
import CounsellorPage from './Dashboard/Councellor';
import Modal from './Modals/Modals';
import DASS from './Tests/DASS';
import GAD from './Tests/GAD';
import PHQ9 from './Tests/PHQ9';

import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { child, get, getDatabase, ref } from 'firebase/database';

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMessage, setModalMessage] = useState('');


  const [userRole, setUserRole] = useState('');
  const [currentUser, setCurrentUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [pendingNavigation, setPendingNavigation] = useState(null);

  const showAccessModal = (message) => {
    setModalMessage(message);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setModalMessage('');
  };


  useEffect(() => {
    const auth = getAuth();
    const db = getDatabase();

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setAuthLoading(true);

      if (user && user.emailVerified) {
        try {

          const snapshot = await get(child(ref(db), `users/${user.uid}`));
          const userData = snapshot.exists() ? snapshot.val() : {};

          console.log('🔍 User authenticated on reload:', {
            uid: user.uid,
            email: user.email,
            role: userData.role || 'user',
            userData: userData
          });

          setCurrentUser({
            uid: user.uid,
            email: user.email,
            emailVerified: user.emailVerified,
            ...userData
          });
          setUserRole(userData.role || 'user');
          setIsLoggedIn(true);
        } catch (error) {
          console.error('Error fetching user data:', error);
          setCurrentUser(null);
          setUserRole('');
          setIsLoggedIn(false);
        }
      } else {
        console.log('🔍 No authenticated user or email not verified');
        setCurrentUser(null);
        setUserRole('');
        setIsLoggedIn(false);
      }

      setAuthLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return (
    <BrowserRouter>
      <div className="app">
        <AppContent
          isLoggedIn={isLoggedIn}
          setIsLoggedIn={setIsLoggedIn}
          modalOpen={modalOpen}
          showAccessModal={showAccessModal}
          closeModal={closeModal}
          modalMessage={modalMessage}
          setModalOpen={setModalOpen}
          setModalMessage={setModalMessage}
          setUserRole={setUserRole}
          userRole={userRole}
          currentUser={currentUser}
          setCurrentUser={setCurrentUser}
          authLoading={authLoading}
          pendingNavigation={pendingNavigation}
          setPendingNavigation={setPendingNavigation}
        />
      </div>
    </BrowserRouter>
  );
}

const AppContent = ({
  isLoggedIn,
  setIsLoggedIn,
  modalOpen,
  showAccessModal,
  closeModal,
  modalMessage,
  setModalOpen,
  setModalMessage,
  setUserRole,
  userRole,
  currentUser,
  setCurrentUser,
  authLoading,
  pendingNavigation,
  setPendingNavigation,
}) => {
  const navigate = useNavigate();


  useEffect(() => {
    console.log('🔍 App - Navigation effect triggered:', {
      pendingNavigation,
      isLoggedIn,
      userRole,
      authLoading
    });

    if (pendingNavigation && isLoggedIn && userRole && !authLoading) {
      console.log('🔍 App - Executing pending navigation:', pendingNavigation);
      navigate(pendingNavigation);
      setPendingNavigation(null);
    }
  }, [pendingNavigation, isLoggedIn, userRole, authLoading, navigate, setPendingNavigation]);


  if (authLoading) {
    return (
      <div className="auth-loading">
        <div className="loading-spinner"></div>
        <p>Loading...</p>
        {currentUser && (
          <div className="debug-info">
            <small>Authenticated as: {currentUser.email} ({currentUser.role || 'user'})</small>
          </div>
        )}
      </div>
    );
  }

  return (
    <>
      <NavBar
        isLoggedIn={isLoggedIn}
        showAccessModal={showAccessModal}
        setIsLoggedIn={setIsLoggedIn}
        userRole={userRole}
      />

      <div className="content">
        <Routes>
          <Route
            path="/"
            element={
              <Home
                isLoggedIn={isLoggedIn}
                showAccessModal={showAccessModal}
              />
            }
          />

          <Route
            path="/Login"
            element={
              <Login
                setIsLoggedIn={setIsLoggedIn}
                setModalOpen={setModalOpen}
                setModalMessage={setModalMessage}
                setUserRole={setUserRole}
                setCurrentUser={setCurrentUser}
                setPendingNavigation={setPendingNavigation}
              />
            }
          />

          <Route path="/Screening" element={<ScreeningPage />} />
          <Route path="/PHQ9" element={<PHQ9 />} />
          <Route path="/GAD" element={<GAD />} />
          <Route path="/DASS" element={<DASS />} />

          <Route
            path="/feed"
            element={
              <ProtectedRoute 
                isLoggedIn={isLoggedIn} 
                userRole={userRole} 
                requiredRole="user"
                redirectTo="/login"
              >
                <Feed />
              </ProtectedRoute>
            }
          />

          <Route
            path="/history"
            element={isLoggedIn ? <History /> : <Navigate to="/" />}
          />

          <Route
            path="/admin"
            element={
              <ProtectedRoute 
                isLoggedIn={isLoggedIn} 
                userRole={userRole} 
                requiredRole="admin"
                redirectTo="/"
              >
                <AdminPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/counsellor"
            element={
              <ProtectedRoute 
                isLoggedIn={isLoggedIn} 
                userRole={userRole} 
                requiredRole="counsellor"
                redirectTo="/"
              >
                <CounsellorPage />
              </ProtectedRoute>
            }
          />

          {}
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </div>

      {}
      {modalOpen && (
        <Modal
          message={modalMessage}
          onClose={closeModal}
          onLogin={() => {
            closeModal();
            navigate('/Login');
          }}
        />
      )}
    </>
  );
};

export default App;
