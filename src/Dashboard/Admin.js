import { getDatabase, onValue, ref, update } from "firebase/database";
import { useEffect, useState } from "react";
import "../CSS/Admin.css";

const AdminDashboard = () => {
  const [users, setUsers] = useState([]);
  const [posts, setPosts] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
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
    if (!selectedUser || !selectedCounsellor) {
      setAssignMsg("Please select both a user and a counsellor");
      return;
    }
    
    const db = getDatabase();
    await update(ref(db, `users/${selectedUser.id}`), {
      assignedCounsellor: selectedCounsellor,
    });
    setAssignMsg(`${selectedUser.email} assigned to counsellor successfully!`);
    setSelectedCounsellor("");
    setTimeout(() => setAssignMsg(""), 3000);
  };

  const counsellors = users.filter((u) => u.role === "counsellor");
  const regularUsers = users.filter((u) => u.role === "user");

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
          <h3>Users List</h3>

          {regularUsers.map((u) => (
            <div
              key={u.id}
              className={`feed-card ${selectedUser?.id === u.id ? "selected" : ""}`}
              onClick={() => setSelectedUser(u)}
            >
              <div className="feed-user">{u.email}</div>
              <p className="feed-snippet">
                {u.assignedCounsellor ? "✓ Assigned" : "Not Assigned"}
              </p>
            </div>
          ))}
        </div>

        {}
        <div className="post-panel">
          {!selectedUser ? (
            <p className="select-placeholder">Select a user</p>
          ) : (
            <>
              <h2>{selectedUser.email || "Unknown User"}</h2>

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
    </div>
  );
};

export default AdminDashboard;
