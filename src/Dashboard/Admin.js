<<<<<<< HEAD
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
=======
import { useEffect, useState } from "react";
import { getDatabase, onValue, ref, update } from "firebase/database";
import "../CSS/Admin.css";

const AdminDashboard = () => {
  const [users, setUsers] = useState([]);
  const [posts, setPosts] = useState([]);
  const [selectedPost, setSelectedPost] = useState(null);
  const [selectedCounsellor, setSelectedCounsellor] = useState("");
  const [assignMsg, setAssignMsg] = useState("");

  
  const [totalUsers, setTotalUsers] = useState(0);
  const [totalCounsellors, setTotalCounsellors] = useState(0);
  const [totalPosts, setTotalPosts] = useState(0);
  const [totalMeetings, setTotalMeetings] = useState(0);

  useEffect(() => {
    const db = getDatabase();

    
    onValue(ref(db, "users"), (snap) => {
      const data = snap.val() || {};
      const usersArray = Object.entries(data).map(([id, u]) => ({ id, ...u }));
      setUsers(usersArray);

      setTotalUsers(usersArray.length);
      setTotalCounsellors(usersArray.filter((u) => u.role === "counsellor").length);
    });

    
    onValue(ref(db, "posts"), (snap) => {
      const data = snap.val() || {};
      const postsArray = Object.entries(data).map(([id, p]) => ({ id, ...p })).reverse();
      setPosts(postsArray);
      setTotalPosts(postsArray.length);
    });

    
    onValue(ref(db, "meetings"), (snap) => {
      if (!snap.exists()) {
        setTotalMeetings(0);
        return;
      }

      const data = snap.val() || {};
      setTotalMeetings(Object.keys(data).length);
    });
  }, []);

  const resolveUser = (authorId, email) => {
    return (
      users.find((u) => u.id === authorId) ||
      users.find((u) => u.email === email) ||
      {}
    );
  };

  const handleAssign = async () => {
    if (!selectedPost || !selectedCounsellor) return;
    const db = getDatabase();
    await update(ref(db, `posts/${selectedPost.id}`), {
      assignedCounsellor: selectedCounsellor,
    });
    setAssignMsg("Counsellor assigned!");
  };

  const counsellors = users.filter((u) => u.role === "counsellor");

  const getImageClass = (src) => {
    const img = new Image();
    img.src = src;

    const h = img.height;
    const w = img.width;

    if (!h || !w) return "square-ratio";

    const ratio = w / h;

    if (ratio === 1) return "square-ratio";
    if (ratio > 1.3) return "landscape-ratio";
    return "portrait-ratio";
  };

  return (
    <div className="dashboard">

      {}
      <div className="stats-row">
        <div className="stat-card purple">
          <h4>Total Users</h4>
          <p>{totalUsers}</p>
        </div>

        <div className="stat-card blue">
          <h4>Active Counsellors</h4>
          <p>{totalCounsellors}</p>
        </div>

        <div className="stat-card green">
          <h4>Total Posts</h4>
          <p>{totalPosts}</p>
        </div>

        <div className="stat-card orange">
          <h4>Meetings Scheduled</h4>
          <p>{totalMeetings}</p>
        </div>
      </div>

      {}
      <div className="main-grid">

        {}
        <div className="feed-panel">
          <h3>Community Feed</h3>

          {posts.map((p) => {
            const user = resolveUser(p.authorId, p.userEmail);
            const email = user.email || p.userEmail || "Unknown User";

            return (
              <div
                key={p.id}
                className="feed-card"
                onClick={() => setSelectedPost(p)}
              >
                <div className="feed-user">{email}</div>

                {p.media ? (
                  <img
                    src={p.media}
                    alt="post"
                    className={`feed-img ${getImageClass(p.media)}`}
                  />
                ) : (
                  <p className="feed-snippet">
                    {(p.text || "(No text)").slice(0, 120)}...
                  </p>
                )}
              </div>
            );
          })}
        </div>

        {}
        <div className="post-panel">
          {!selectedPost ? (
            <p className="select-placeholder">Select a user</p>
          ) : (
            <>
              <h2>{selectedPost.userEmail || "Unknown User"}</h2>

              <div className="assign-box">
                <label>Assign Counsellor</label>

                <select
                  value={selectedCounsellor}
                  onChange={(e) => setSelectedCounsellor(e.target.value)}
                >
                  <option value="">Select Counsellor</option>
                  {counsellors.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.email}
                    </option>
                  ))}
                </select>

                <button onClick={handleAssign} className="assign-btn">
                  Confirm Assignment
                </button>

                {assignMsg && <p className="assign-msg">{assignMsg}</p>}
              </div>
            </>
          )}
        </div>
      </div>
>>>>>>> upstream/master
    </div>
  );
};

<<<<<<< HEAD
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

=======
>>>>>>> upstream/master
export default AdminDashboard;
