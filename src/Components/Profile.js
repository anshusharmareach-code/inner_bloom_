import React, { useState, useEffect } from 'react';
import { getAuth } from 'firebase/auth';
import { getDatabase, ref, get, child } from 'firebase/database';
import '../CSS/Profile.css';

const Profile = ({ isOpen, onClose }) => {
  const [userInfo, setUserInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      fetchUserInfo();
    }
  }, [isOpen]);

  const fetchUserInfo = async () => {
    try {
      setLoading(true);
      setError('');

      const auth = getAuth();
      const currentUser = auth.currentUser;

      if (!currentUser) {
        setError('No user is currently logged in');
        setLoading(false);
        return;
      }


      const db = getDatabase();
      const snapshot = await get(child(ref(db), `users/${currentUser.uid}`));

      if (snapshot.exists()) {
        const userData = snapshot.val();
        setUserInfo({
          uid: currentUser.uid,
          email: currentUser.email,
          emailVerified: currentUser.emailVerified,
          role: userData.role || 'user',
          assignedCounsellor: userData.assignedCounsellor || 'None',
          createdAt: currentUser.metadata.creationTime,
          lastSignIn: currentUser.metadata.lastSignInTime,
          ...userData
        });
      } else {
        setUserInfo({
          uid: currentUser.uid,
          email: currentUser.email,
          emailVerified: currentUser.emailVerified,
          role: 'user',
          assignedCounsellor: 'None',
          createdAt: currentUser.metadata.creationTime,
          lastSignIn: currentUser.metadata.lastSignInTime
        });
      }
    } catch (err) {
      console.error('Error fetching user info:', err);
      setError('Failed to load user information');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="profile-overlay" onClick={onClose}>
      <div className="profile-modal" onClick={(e) => e.stopPropagation()}>
        <div className="profile-header">
          <h2>User Profile</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        <div className="profile-content">
          {loading ? (
            <div className="loading">Loading user information...</div>
          ) : error ? (
            <div className="error">
              <p>{error}</p>
              <button onClick={fetchUserInfo} className="retry-btn">Retry</button>
            </div>
          ) : userInfo ? (
            <div className="user-details">
              <div className="detail-group">
                <label>User ID:</label>
                <span className="user-id">{userInfo.uid}</span>
              </div>

              <div className="detail-group">
                <label>Email:</label>
                <span>{userInfo.email}</span>
              </div>

              <div className="detail-group">
                <label>Email Verified:</label>
                <span className={userInfo.emailVerified ? 'verified' : 'not-verified'}>
                  {userInfo.emailVerified ? 'Yes' : 'No'}
                </span>
              </div>

              <div className="detail-group">
                <label>Role:</label>
                <span className={`role role-${userInfo.role}`}>{userInfo.role}</span>
              </div>

              <div className="detail-group">
                <label>Assigned Counsellor:</label>
                <span>{userInfo.assignedCounsellor}</span>
              </div>

              <div className="detail-group">
                <label>Account Created:</label>
                <span>{new Date(userInfo.createdAt).toLocaleString()}</span>
              </div>

              <div className="detail-group">
                <label>Last Sign In:</label>
                <span>{new Date(userInfo.lastSignIn).toLocaleString()}</span>
              </div>
            </div>
          ) : (
            <div className="no-data">No user information available</div>
          )}
        </div>

        <div className="profile-footer">
          <button onClick={onClose} className="close-profile-btn">Close</button>
        </div>
      </div>
    </div>
  );
};

export default Profile;
