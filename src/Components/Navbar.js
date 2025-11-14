import { getAuth, onAuthStateChanged, signOut } from 'firebase/auth';
import { onValue, ref } from 'firebase/database';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../CSS/Nav.css';

import CreatePostModal from '../Modals/CreatePostModal';
import { db as sharedDb } from './firebase';
import ProfileMenu from './Profilemenu';

import ExportIcon from '../Assets/export-button.jpeg';

import avatar1 from '../Assets/1.jpeg';
import avatar2 from '../Assets/2.jpeg';
import avatar3 from '../Assets/3.jpeg';
import avatar4 from '../Assets/4.jpeg';
import avatar5 from '../Assets/5.jpeg';
import avatar6 from '../Assets/6.jpeg';
import avatar7 from '../Assets/7.jpeg';
import avatar8 from '../Assets/8.jpeg';
import avatar9 from '../Assets/9.jpeg';
import avatar10 from '../Assets/10.jpeg';
import avatar11 from '../Assets/11.jpeg';
import avatar12 from '../Assets/12.jpeg';
import avatar13 from '../Assets/13.jpeg';
import avatar14 from '../Assets/14.jpeg';
import avatar15 from '../Assets/15.jpeg';

const avatars = [
  avatar1, avatar2, avatar3, avatar4, avatar5,
  avatar6, avatar7, avatar8, avatar9, avatar10,
  avatar11, avatar12, avatar13, avatar14, avatar15
];

const NavBar = ({ isLoggedIn, setIsLoggedIn, userRole }) => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [testHistory, setTestHistory] = useState([]);

  const menuRef = useRef(null);


<<<<<<< HEAD
  
=======

>>>>>>> upstream/master

  useEffect(() => {
    const auth = getAuth();
    const db = sharedDb;

    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);

      if (currentUser) {
        setIsLoggedIn(true);

        const resultsRef = ref(db, `users/${currentUser.uid}/assessmentResults`);
        onValue(resultsRef, (snapshot) => {
          const data = snapshot.val();
          if (!data) return setTestHistory([]);

          const formatted = Object.entries(data)
            .map(([id, val]) => ({ id, ...val }))
            .sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));

          setTestHistory(formatted);
        });
      } else {
        setTestHistory([]);
      }
    });

    return () => unsubscribe();
  }, [setIsLoggedIn]);


<<<<<<< HEAD
  
=======

>>>>>>> upstream/master

  const userAvatar = useMemo(() => {
    if (!user?.email) {
      return avatars[Math.floor(Math.random() * avatars.length)];
    }

    const saved = localStorage.getItem(`avatar_${user.email}`);
    if (saved) return saved;

    const random = avatars[Math.floor(Math.random() * avatars.length)];
    localStorage.setItem(`avatar_${user.email}`, random);
    return random;
  }, [user?.email]);


<<<<<<< HEAD
  
=======

>>>>>>> upstream/master

  const handleLogout = async () => {
    try {
      await signOut(getAuth());
      setIsLoggedIn(false);
      navigate('/');
    } catch (e) {
      console.log(e);
    }
  };


<<<<<<< HEAD
  
=======

>>>>>>> upstream/master

  const exportToCSV = () => {
    if (!testHistory.length) return;

    let csv = "Test Type,Date,Score,Interpretation,DASS Subscale,Subscale Score,Subscale Interpretation\n";

    const dateText = (t) => new Date(t).toLocaleString();

    testHistory.forEach((r) => {
      if (r.testType === "DASS-21") {
        Object.entries(r.results).forEach(([key, val]) => {
          csv += `DASS-21,${dateText(r.timestamp)},,,${key},${val.score},${val.interpretation}\n`;
        });
      } else {
        csv += `${r.testType},${dateText(r.timestamp)},${r.score || ""},${r.interpretation || ""},,,\n`;
      }
    });

    const blob = new Blob([csv]);
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "test_history.csv";
    a.click();
  };


<<<<<<< HEAD
  
=======

>>>>>>> upstream/master

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setIsProfileOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);


<<<<<<< HEAD
  
=======


  const handleLogoClick = () => {
    if (userRole === 'admin') {
      navigate('/admin');
    } else if (userRole === 'counsellor') {
      navigate('/counsellor');
    } else {
      navigate('/');
    }
  };
>>>>>>> upstream/master

  return (
    <nav className="navbar">

      {}
<<<<<<< HEAD
      <div className="brand-wrapper" onClick={() => navigate('/')}>
=======
      <div className="brand-wrapper" onClick={handleLogoClick}>
>>>>>>> upstream/master
        <span className="company-name">MindCare</span>
      </div>

      <div className="nav-actions">
        {isLoggedIn ? (
          <div className="icon-group-wrapper">

            {}
            {userRole === "user" && (
              <button className="icon-btn" onClick={() => setIsCreateModalOpen(true)}>
                ➕
              </button>
            )}

            {}
            <button
              className="icon-btn"
              onClick={exportToCSV}
              disabled={!testHistory.length}
            >
              <img src={ExportIcon} alt="Export" className="export-image" />
            </button>

            {}
            <img
              src={userAvatar}
              className="icon-avatar"
              alt="avatar"
              onClick={() => setIsProfileOpen((prev) => !prev)}
            />

            {}
            {isProfileOpen && (
              <div ref={menuRef} className="dropdown-container">
                <ProfileMenu
                  userAvatar={userAvatar}
                  userRole={userRole}
                  userEmail={user?.email}
                  onLogout={handleLogout}
                  onHistory={() => navigate('/history')}
                />
              </div>
            )}

            {}
            {isCreateModalOpen && (
              <CreatePostModal onClose={() => setIsCreateModalOpen(false)} />
            )}

          </div>
        ) : (
          <button className="nav-btn login-btn" onClick={() => navigate('/Login')}>
            Login
          </button>
        )}
      </div>
    </nav>
  );
};

export default NavBar;
