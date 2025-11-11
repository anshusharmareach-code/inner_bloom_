import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { getDatabase, limitToLast, onValue, orderByChild, query, ref, update } from 'firebase/database';
import { useEffect, useState } from 'react';
import '../CSS/Admin.css';

const MS_IN_DAY = 24 * 60 * 60 * 1000;

const AdminDashboard = () => {
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState('');
  const [selectedCounsellor, setSelectedCounsellor] = useState('');
  const [assignStatus, setAssignStatus] = useState('');
  const [recentUsers, setRecentUsers] = useState([]);
  const [currentUserRole, setCurrentUserRole] = useState(null);
  const [loading, setLoading] = useState(true);

  
  useEffect(() => {
    const auth = getAuth();
    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      if (user) {
        const db = getDatabase();
        const userRoleRef = ref(db, `users/${user.uid}/role`);
        onValue(userRoleRef, (snapshot) => {
          setCurrentUserRole(snapshot.val());
        });
      } else {
        setCurrentUserRole(null);
      }
    });

    return () => unsubscribeAuth();
  }, []);

  
  useEffect(() => {
    const db = getDatabase();

    const usersRef = ref(db, 'users');
    const unsubscribeUsers = onValue(usersRef, (snapshot) => {
      const data = snapshot.val() || {};
      const usersArray = Object.entries(data).map(([uid, user]) => ({
        uid,
        email: user.email || '',
        role: user.role || 'user',
        status: user.status || 'inactive',
        registrationDate: user.registrationDate || null,
      }));
      setUsers(usersArray);
      setLoading(false);
    });

    
    const recentQuery = query(usersRef, orderByChild('registrationDate'), limitToLast(5));
    const unsubscribeRecent = onValue(recentQuery, (snapshot) => {
      const data = snapshot.val() || {};
      const recent = Object.entries(data)
        .map(([uid, user]) => ({
          uid,
          email: user.email || '',
          status: user.status || 'inactive',
          registrationDate: user.registrationDate || null,
        }))
        .sort((a, b) => new Date(b.registrationDate) - new Date(a.registrationDate));
      setRecentUsers(recent);
    });

    return () => {
      unsubscribeUsers();
      unsubscribeRecent();
    };
  }, []);

  if (loading) {
    return <div>Loading...</div>;
  }

  const parseDate = (date) => (date ? new Date(date) : null);

  
  const totalUsers = users.length;
  const activeUsersCount = users.filter((u) => u.status === 'active').length;
  const now = new Date();
  const THIRTY_DAYS_AGO = new Date(now.getTime() - 30 * MS_IN_DAY);
  const newUsersCount = users.filter((u) => {
    const regDate = parseDate(u.registrationDate);
    return regDate && regDate >= THIRTY_DAYS_AGO;
  }).length;

  const activeUsersBefore30Days = users.filter((u) => {
    const regDate = parseDate(u.registrationDate);
    return regDate && regDate < THIRTY_DAYS_AGO && u.status === 'active';
  }).length;

  let userGrowthPercent = 0;
  if (activeUsersBefore30Days > 0) {
    userGrowthPercent = ((activeUsersCount - activeUsersBefore30Days) / activeUsersBefore30Days) * 100;
  } else if (activeUsersCount > 0) {
    userGrowthPercent = 100;
  }

  // Assignment logic
  const userOptions = users.filter(u => u.role === 'user');
  const counsellorOptions = users.filter(u => u.role === 'counsellor');

  const handleAssign = async () => {
    if (!selectedUser || !selectedCounsellor) {
      setAssignStatus('Please select both a user and a counsellor.');
      return;
    }
    setAssignStatus('Assigning...');
    try {
      const db = getDatabase();
      await update(ref(db, `users/${selectedUser}`), {
        assignedCounsellor: selectedCounsellor
      });
      setAssignStatus('User assigned to counsellor successfully!');
    } catch (error) {
      setAssignStatus('Error assigning user.');
    }
  };

  return (
    <div className="admin-dashboard-container" style={{ fontFamily: 'Arial, sans-serif', padding: 20, maxWidth: 900, margin: 'auto' }}>
      <h1>Admin Dashboard</h1>

      {/* Assignment Section */}
      <section style={{ marginBottom: 30, background: '#f8f9fa', borderRadius: 8, padding: 20 }}>
        <h3>Assign User to Counsellor</h3>
        <div style={{ display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap' }}>
          <div>
            <label>User:&nbsp;</label>
            <select value={selectedUser} onChange={e => setSelectedUser(e.target.value)}>
              <option value="">Select User</option>
              {userOptions.map(u => (
                <option key={u.uid} value={u.uid}>{u.email}</option>
              ))}
            </select>
          </div>
          <div>
            <label>Counsellor:&nbsp;</label>
            <select value={selectedCounsellor} onChange={e => setSelectedCounsellor(e.target.value)}>
              <option value="">Select Counsellor</option>
              {counsellorOptions.map(c => (
                <option key={c.uid} value={c.uid}>{c.email}</option>
              ))}
            </select>
          </div>
          <button onClick={handleAssign} style={{ padding: '6px 18px', borderRadius: 6, background: '#7c3aed', color: 'white', border: 'none', fontWeight: 600, cursor: 'pointer' }}>Assign</button>
        </div>
        {assignStatus && <div style={{ marginTop: 10, color: assignStatus.includes('success') ? 'green' : 'red' }}>{assignStatus}</div>}
      </section>

      {/* ...existing code... */}
      <div style={{ display: 'flex', gap: 15, marginBottom: 20 }}>
        <div style={cardStyle}>
          <div>Total Users</div>
          <div style={{ fontWeight: 'bold', fontSize: 22 }}>{totalUsers.toLocaleString()}</div>
        </div>
        <div style={cardStyle}>
          <div>Active Users</div>
          <div style={{ fontWeight: 'bold', fontSize: 22 }}>{activeUsersCount.toLocaleString()}</div>
        </div>
        <div style={cardStyle}>
          <div>New Users (30 days)</div>
          <div style={{ fontWeight: 'bold', fontSize: 22 }}>{newUsersCount.toLocaleString()}</div>
        </div>
      </div>

      <section style={{ marginBottom: 30 }}>
        <h3>User Growth</h3>
        <div style={{ fontWeight: 'bold', fontSize: 18, marginBottom: 5 }}>
          {userGrowthPercent.toFixed(1)}%
        </div>
      </section>

      <section>
        <h3>Recent Users</h3>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead style={{ backgroundColor: '#f8f9fa' }}>
            <tr>
              <th style={thStyle}>Name</th>
              <th style={thStyle}>Email</th>
              <th style={thStyle}>Registration Date</th>
              <th style={thStyle}>Status</th>
            </tr>
          </thead>
          <tbody>
            {recentUsers.length === 0 && (
              <tr>
                <td colSpan={4} style={{ padding: 10, textAlign: 'center' }}>No users found.</td>
              </tr>
            )}
            {recentUsers.map((user) => (
              <tr key={user.uid} style={{ borderBottom: '1px solid #ddd' }}>
                <td style={tdStyle}>{user.email.split('@')[0] || 'No Name'}</td>
                <td style={tdStyle}>{user.email}</td>
                <td style={tdStyle}>{parseDate(user.registrationDate)?.toISOString().split('T')[0] || '-'}</td>
                <td style={{
                  ...tdStyle,
                  color: user.status === 'active' ? 'green' : 'red',
                  fontWeight: 'bold',
                }}>{user.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
};

const cardStyle = {
  backgroundColor: '#f8f9fa',
  borderRadius: 8,
  padding: 20,
  flex: 1,
  textAlign: 'center',
  boxShadow: '0 2px 10px rgba(0,0,0,0.05)',
};

const thStyle = {
  textAlign: 'left',
  padding: 10,
  borderBottom: '2px solid #ddd',
  fontWeight: '600',
  color: '#343a40',
};

const tdStyle = {
  padding: 10,
  color: '#495057',
};

export default AdminDashboard;
