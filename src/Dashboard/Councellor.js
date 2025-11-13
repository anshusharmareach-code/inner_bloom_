import React, { useState, useEffect } from 'react';
import { getAuth } from 'firebase/auth';
import { getDatabase, ref, get, child, onValue } from 'firebase/database';
import '../CSS/Dashboard.css';

const CounsellorDashboard = () => {
  const [counsellorInfo, setCounsellorInfo] = useState(null);
  const [assignedUsers, setAssignedUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCounsellorData();
    fetchAssignedUsers();
  }, []);

  const fetchCounsellorData = async () => {
    try {
      const auth = getAuth();
      const currentUser = auth.currentUser;

      if (currentUser) {
        const db = getDatabase();
        const snapshot = await get(child(ref(db), `users/${currentUser.uid}`));
        const userData = snapshot.exists() ? snapshot.val() : {};

        setCounsellorInfo({
          uid: currentUser.uid,
          email: currentUser.email,
          role: userData.role || 'counsellor',
          ...userData
        });
      }
    } catch (error) {
      console.error('Error fetching counsellor data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAssignedUsers = () => {
    const db = getDatabase();
    const usersRef = ref(db, 'users');

    onValue(usersRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const users = Object.entries(data)
          .filter(([uid, userData]) => 
            userData.role === 'user' && 
            userData.assignedCounsellor === counsellorInfo?.uid
          )
          .map(([uid, userData]) => ({ uid, ...userData }));

        setAssignedUsers(users);
      }
    });
  };

  if (loading) {
    return <div className="dashboard-loading">Loading counsellor dashboard...</div>;
  }

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h1>Counsellor Dashboard</h1>
        <p>Welcome, {counsellorInfo?.email}</p>
      </div>

      <div className="dashboard-content">
        <div className="dashboard-card">
          <h3>Your Profile</h3>
          <p><strong>Role:</strong> {counsellorInfo?.role}</p>
          <p><strong>Email:</strong> {counsellorInfo?.email}</p>
          <p><strong>Assigned Users:</strong> {assignedUsers.length}</p>
        </div>

        <div className="dashboard-card">
          <h3>Assigned Users</h3>
          {assignedUsers.length > 0 ? (
            <ul className="user-list">
              {assignedUsers.map((user) => (
                <li key={user.uid} className="user-item">
                  <span>{user.email}</span>
                  <button className="view-btn">View Details</button>
                </li>
              ))}
            </ul>
          ) : (
            <p>No users assigned yet.</p>
          )}
        </div>

        <div className="dashboard-card">
          <h3>Quick Actions</h3>
          <div className="action-buttons">
            <button className="action-btn">View All Users</button>
            <button className="action-btn">Create Report</button>
            <button className="action-btn">Schedule Session</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CounsellorDashboard;