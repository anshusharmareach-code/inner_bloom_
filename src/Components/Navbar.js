import { getAuth, onAuthStateChanged, signOut } from 'firebase/auth';
import { onValue, ref } from 'firebase/database';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../CSS/Nav.css';
import CreatePostModal from '../Modals/CreatePostModal';
import { db as sharedDb } from './firebase';
import ProfileMenu from './Profilemenu';

import avatar1 from '../Assets/1.jpeg';
import avatar10 from '../Assets/10.jpeg';
import avatar11 from '../Assets/11.jpeg';
import avatar12 from '../Assets/12.jpeg';
import avatar13 from '../Assets/13.jpeg';
import avatar14 from '../Assets/14.jpeg';
import avatar15 from '../Assets/15.jpeg';
import avatar2 from '../Assets/2.jpeg';
import avatar3 from '../Assets/3.jpeg';
import avatar4 from '../Assets/4.jpeg';
import avatar5 from '../Assets/5.jpeg';
import avatar6 from '../Assets/6.jpeg';
import avatar7 from '../Assets/7.jpeg';
import avatar8 from '../Assets/8.jpeg';
import avatar9 from '../Assets/9.jpeg';

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


  useEffect(() => {
    const auth = getAuth();
    const db = sharedDb;
    
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        setIsLoggedIn(true);
        
        // Fetch test history for export functionality
        const resultsRef = ref(db, `users/${currentUser.uid}/assessmentResults`);
        onValue(resultsRef, (snapshot) => {
          const data = snapshot.val();
          if (data) {
            const resultsData = Object.entries(data)
              .map(([id, result]) => ({
                id,
                ...result,
              }))
              .sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
            setTestHistory(resultsData);
          } else {
            setTestHistory([]);
          }
        });
      } else {
        setTestHistory([]);
      }
    });
    
    return () => unsubscribe();
  }, [setIsLoggedIn]);


  const userAvatar = useMemo(() => {
    if (!user?.email) return avatars[Math.floor(Math.random() * avatars.length)];
    const savedAvatar = localStorage.getItem(`avatar_${user.email}`);
    if (savedAvatar) return savedAvatar;
    const random = avatars[Math.floor(Math.random() * avatars.length)];
    localStorage.setItem(`avatar_${user.email}`, random);
    return random;
  }, [user?.email]);


  useEffect(() => {
    const handleClickOutside = (event) => {
      if (isProfileOpen && menuRef.current && !menuRef.current.contains(event.target)) {
        setIsProfileOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isProfileOpen]);

  const handleBrandClick = () => {
    if (!isLoggedIn) navigate('/');
    else if (userRole === 'admin') navigate('/admin');
    else if (userRole === 'counsellor') navigate('/counsellor');
    else navigate('/');
  };

  const handleAuthClick = async () => {
    if (isLoggedIn) {
      try {
        const auth = getAuth();
        await signOut(auth);
        setIsLoggedIn(false);
        navigate('/');
      } catch (err) {
        console.error('Sign out error:', err);
      }
    } else {
      navigate('/Login');
    }
  };

  const exportToCSV = () => {
    if (!testHistory.length) return;

    const headers = [
      'Test Type',
      'Date',
      'Score',
      'Interpretation',
      'DASS Subscale',
      'Subscale Score',
      'Subscale Interpretation',
    ];

    const formatDate = (timestamp) => {
      if (!timestamp) return 'Unknown date';
      const date = new Date(timestamp);
      return date.toLocaleString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    };

    const rows = testHistory.flatMap((result) => {
      if (result.testType === 'DASS-21' && result.results) {
        return Object.entries(result.results).map(([subscale, details]) => [
          result.testType,
          formatDate(result.timestamp || result.createdAt),
          '',
          '',
          subscale,
          details.score,
          details.interpretation,
        ]);
      } else {
        return [
          [
            result.testType,
            formatDate(result.timestamp || result.createdAt),
            result.score || result.totalScore || '',
            result.resultInterpretation || result.interpretation || '',
            '',
            '',
            '',
          ],
        ];
      }
    });

    let csvContent = '';
    csvContent += headers.join(',') + '\n';
    rows.forEach((row) => {
      const escapedRow = row.map((field) =>
        typeof field === 'string' && (field.includes(',') || field.includes('"'))
          ? `"${field.replace(/"/g, '""')}"`
          : field
      );
      csvContent += escapedRow.join(',') + '\n';
    });

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'test_history.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <nav className="navbar">
      <div className="nav-brand" onClick={handleBrandClick}>
        <span className="company-name">MindCare</span>
      </div>

      <div className="nav-actions">
        {isLoggedIn ? (
          <div className="nav-user-section">
            {userRole === 'user' && (
              <button
                className="create-post-icon"
                onClick={() => setIsCreateModalOpen(true)}
                title="Create Post"
              >
                ➕
              </button>
            )}
            <button 
              className="export-btn" 
              onClick={exportToCSV}
              disabled={testHistory.length === 0}
              title={testHistory.length === 0 ? "No test history to export" : "Export test history"}
            >
              ⬇
            </button>
            <img
              src={userAvatar}
              alt="avatar"
              className="nav-avatar"
              onClick={() => setIsProfileOpen(prev => !prev)}
            />

            {isProfileOpen && (
              <div ref={menuRef} className="dropdown-container">
                <ProfileMenu
                  userRole={userRole}
                  userEmail={user?.email}
                  userName={user?.displayName || 'User'}
                  userAvatar={userAvatar}
                  onLogout={() => {
                    handleAuthClick();
                    setIsProfileOpen(false);
                  }}
                  onHistory={() => {
                    navigate('/history');
                    setIsProfileOpen(false);
                  }}
                  onSettings={() => {
                    setIsProfileOpen(false);
                  }}
                />
              </div>
            )}
            {isCreateModalOpen && (
              <CreatePostModal onClose={() => setIsCreateModalOpen(false)} />
            )}
          </div>
        ) : (
          <button className="nav-btn login-btn" onClick={handleAuthClick}>Login</button>
        )}
      </div>
    </nav>
  );
};

export default NavBar;
