import { onValue, push, ref, remove, update } from "firebase/database";
import { useEffect, useRef, useState } from "react";
import "../CSS/Post.css";
import { auth, db } from "./firebase";

const Post = ({ post, currentUser, userRole }) => {
  const [comment, setComment] = useState("");
  const [showComments, setShowComments] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState(post.content);
  const [originalContent] = useState(post.content);
  const menuRef = useRef(null);

  const currentUid = currentUser?.uid || auth.currentUser?.uid;
  const isAdmin = userRole === "admin";
  const isPostOwner =
    !!currentUid &&
    (currentUid === post.authorId || currentUid === post.userId || isAdmin);

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString() + " " + date.toLocaleTimeString();
  };

  useEffect(() => {
    const commentsRef = ref(db, `posts/${post.id}/comments`);
    const unsubscribe = onValue(commentsRef, () => {});
    return () => unsubscribe();
  }, [post.id]);

  useEffect(() => {
    const handler = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setShowMenu(false);
      }
    };
    if (showMenu) document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [showMenu]);

  const handleEdit = async () => {
    if (!editedContent.trim()) return;
    await update(ref(db, `posts/${post.id}`), { content: editedContent });
    setIsEditing(false);
    setShowMenu(false);
  };

  const handleCancel = () => {
    setEditedContent(originalContent);
    setIsEditing(false);
  };

  const handleDelete = async () => {
    if (window.confirm("Delete this post?")) {
      await remove(ref(db, `posts/${post.id}`));
      setShowMenu(false);
    }
  };

  const handleComment = async (e) => {
    e.preventDefault();
    if (!comment.trim()) return;

    const user = auth.currentUser;
    if (!user) return;

    const newComment = {
      userId: user.uid,
      userEmail: user.email,
      content: comment,
      timestamp: Date.now(),
    };

    await push(ref(db, `posts/${post.id}/comments`), newComment);
    setComment("");
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

  return (
    <div className="post-card">
      <div className="post-header">
        <div>
          <div className="post-user">{post.userEmail}</div>
          <div className="post-time">{formatTime(post.timestamp)}</div>
        </div>

        <div className="post-menu-container" ref={menuRef}>
          {isPostOwner && (
            <button
              className="menu-btn"
              onClick={() => setShowMenu(!showMenu)}
            >
              ⋮
            </button>
          )}

          {showMenu && isPostOwner && (
            <div className="post-menu">
              <button
                onClick={() => {
                  setIsEditing(true);
                  setShowMenu(false);
                }}
                className="menu-item edit-item"
              >
                ✏️ Edit
              </button>
              <button onClick={handleDelete} className="menu-item delete-item">
                🗑️ Delete
              </button>
            </div>
          )}
        </div>
      </div>

      {isEditing ? (
        <div className="edit-section">
          <textarea
            className="edit-textarea"
            value={editedContent}
            onChange={(e) => setEditedContent(e.target.value)}
            maxLength={500}
          />
          <div className="edit-actions">
            <button onClick={handleEdit} className="edit-save-btn">
              Save
            </button>
            <button onClick={handleCancel} className="edit-cancel-btn">
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <div className="post-content">{editedContent}</div>
      )}

      {post.media && (
        <div className={`post-media ${getMediaRatio(post.media)}`}>
          {post.media.startsWith("data:image") ? (
            <img src={post.media} alt="Post" />
          ) : (
            <video src={post.media} controls />
          )}
        </div>
      )}

      <div className="post-actions">
        <button
          className="action-btn comment-btn"
          onClick={() => setShowComments(!showComments)}
        >
          💬 {post.comments ? Object.keys(post.comments).length : 0}
        </button>
      </div>

      {showComments && (
        <div className="comments-section">
          <form onSubmit={handleComment} className="comment-form">
            <input
              type="text"
              placeholder="Add a comment..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
            />
            <button type="submit">Post</button>
          </form>

          <div className="comments-list">
            {post.comments &&
              Object.entries(post.comments).map(([id, c]) => (
                <div key={id} className="comment">
                  <strong>{c.userEmail}</strong>
                  <p>{c.content}</p>
                  <small>{formatTime(c.timestamp)}</small>
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default Post;
