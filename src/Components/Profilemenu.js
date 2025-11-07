import React from 'react';
import { useNavigate } from 'react-router-dom';
import '../CSS/Profilemenu.css';

const ProfileMenu = ({
  userRole,
  userEmail,
  userName,
  userAvatar,
  onLogout,
  onHistory,
  onSettings,
}) => {
  const navigate = useNavigate();

  const handleProfileClick = () => {

    if (onSettings) onSettings();


    setTimeout(() => {
      if (userRole === 'admin') {
        window.location.href = '/admin';
      } else if (userRole === 'counsellor') {
        window.location.href = '/counsellor';
      } else {
        window.location.href = '/';
      }
    }, 100);
  };

  return (
    <div className="profile-menu">
      <div className="profile-header">
        <img src={userAvatar} alt="avatar" className="profile-avatar" />
        <div className="profile-info">
          <p>{userEmail}</p>
          <span className={`role ${userRole}`}>{userRole}</span>
        </div>
      </div>

      <div className="profile-options">
        <button onClick={handleProfileClick}>Profile</button>
        {userRole === 'user' && <button onClick={onHistory}>History</button>}
        <button onClick={onSettings}>Settings</button>
      </div>

      <button className="logout-btn" onClick={onLogout}>
        Logout
      </button>
    </div>
  );
};

export default ProfileMenu;
