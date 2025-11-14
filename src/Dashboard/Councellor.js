import { getAuth } from "firebase/auth";
import { child, get, getDatabase, onValue, ref, update } from "firebase/database";
import { useEffect, useState } from "react";
import "../CSS/Dashboard.css";

const CounsellorDashboard = () => {
  const [counsellorInfo, setCounsellorInfo] = useState(null);
  const [assignedUsers, setAssignedUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);

  const [userPosts, setUserPosts] = useState([]);
  const [activeTab, setActiveTab] = useState("posts"); 

  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCounsellorData();
  }, []);

  useEffect(() => {
    if (counsellorInfo?.uid) {
      fetchAssignedUsers();
    }
  }, [counsellorInfo]);

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
          role: userData.role || "counsellor",
          ...userData,
        });
      }
    } catch (error) {
      console.error("Error fetching counsellor:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAssignedUsers = () => {
    const db = getDatabase();
    const refUsers = ref(db, "users");

    onValue(refUsers, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const list = Object.entries(data)
          .filter(([uid, usr]) => usr.role === "user" && usr.assignedCounsellor === counsellorInfo?.uid)
          .map(([uid, usr]) => ({ uid, ...usr }));

        setAssignedUsers(list);
      }
    });
  };

  const fetchUserPosts = (user) => {
    const db = getDatabase();
    const postsRef = ref(db, 'posts');

    onValue(postsRef, (snap) => {
      const data = snap.val();
      if (!data) {
        setUserPosts([]);
        return;
      }

      const userPostsList = Object.entries(data)
        .filter(([_, post]) =>
          post.authorId === user.uid ||
          post.userEmail === user.email
        )
        .map(([postId, post]) => ({
          id: postId,
          ...post,
        }));

      userPostsList.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));

      setUserPosts(userPostsList);
    });
  };


  const handleSelectUser = (user) => {
    setSelectedUser(user);
    setActiveTab("posts");
    fetchUserPosts(user);
  };


  const markAsReviewed = (postId) => {
    try {
      const db = getDatabase();

      const postRef = ref(db, `posts/${postId}`);


      setUserPosts((prev) => prev.map(p => p.id === postId ? { ...p, status: 'reviewed' } : p));

      update(postRef, { status: "reviewed" });
    } catch (err) {
      console.error('Error marking post reviewed:', err);
      alert('Failed to mark as reviewed');
    }
  };


  const addNote = (postId) => {
    alert("Add Note clicked (you can customize this).");
  };

  const getMediaRatio = (src) => {
    const img = new Image();
    img.src = src;

    const w = img.width;
    const h = img.height;

    if (!w || !h) return "square-ratio";
    const ratio = w / h;

    if (ratio === 1) return "square-ratio";
    if (ratio > 1.3) return "landscape-ratio";
    return "portrait-ratio";
  };

  if (loading) {
    return <div className="dashboard-loading">Loading...</div>;
  }

  return (
    <div className="cd-wrapper">

      {}
      <div className="cd-sidebar">
        <h2>Assigned Users</h2>

        <div className="cd-search-box">
          <i className="search-icon">🔍</i>
          <input
            type="text"
            placeholder="Search users..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="cd-user-list">
          {assignedUsers
            .filter((u) =>
              (u.name || u.email || "")
                .toLowerCase()
                .includes(search.toLowerCase())
            )
            .map((user) => (
              <div
                key={user.uid}
                className={`cd-user-item ${selectedUser?.uid === user.uid ? "active" : ""}`}
                onClick={() => handleSelectUser(user)}
              >
                <span>{user.name || user.email}</span>
              </div>
            ))}
        </div>
      </div>

      {}
      <div className="cd-main">

        {!selectedUser ? (
          <p className="cd-placeholder">Select a user to view posts</p>
        ) : (
          <>
            {}
            <div className="cd-user-header">
              <button
                className="cd-back-btn"
                onClick={() => { setSelectedUser(null); setUserPosts([]); }}
                aria-label="Back to users list"
              >
                ← Back
              </button>
              <h2>{selectedUser.name || selectedUser.email}</h2>
            </div>

            {}
            <div className="cd-tabs">
              <button
                className={activeTab === "posts" ? "active" : ""}
                onClick={() => setActiveTab("posts")}
              >
                User Posts
              </button>

              <button
                className={activeTab === "reports" ? "active" : ""}
                onClick={() => setActiveTab("reports")}
              >
                Reports
              </button>

              <button
                className={activeTab === "scheduler" ? "active" : ""}
                onClick={() => setActiveTab("scheduler")}
              >
                Scheduler
              </button>
            </div>

            {}
            {activeTab === "posts" && (
              <div className="cd-post-list">
                {userPosts.length === 0 && <p>No posts yet.</p>}

                {userPosts.map((post) => (
                  <div className="cd-post-card" key={post.id}>
                    <div className="cd-post-header">
                      <h4>User Post</h4>
                    </div>

                    {post.content && <p className="cd-post-text">{post.content}</p>}
                    {post.media && (
                      <div className={`cd-post-media ${getMediaRatio(post.media)}`}>
                        {post.media.startsWith('data:image') ? (
                          <img src={post.media} className="cd-post-img" alt="post media" />
                        ) : (
                          <video src={post.media} controls className="cd-post-video" />
                        )}
                      </div>
                    )}

                    <div className="cd-actions">
                      <button onClick={() => addNote(post.id)}>Add Note</button>
                    </div>

                    <p className="cd-date">{new Date(post.timestamp).toLocaleString()}</p>
                  </div>
                ))}
              </div>
            )}

            {activeTab === "reports" && (
              <div className="cd-tab-content">
                <h3>Reports Section</h3>
                <p>Here you can create and view reports.</p>
              </div>
            )}

            {activeTab === "scheduler" && (
              <div className="cd-tab-content">
                <h3>Scheduler</h3>
                <p>Your upcoming sessions and schedule will appear here.</p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default CounsellorDashboard;
