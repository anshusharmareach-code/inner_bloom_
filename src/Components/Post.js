<<<<<<< HEAD
import { onValue, push, ref, remove, update } from 'firebase/database';
import { useEffect, useState } from 'react';
import '../CSS/Post.css';
import { auth, db } from './firebase';

const Post = ({ post, currentUser, userRole }) => {
  const [isLiked, setIsLiked] = useState(
    post.likes && post.likes[auth.currentUser?.uid]
  );
  const [likesCount, setLikesCount] = useState(
    post.likes ? Object.keys(post.likes).length : 0
  );
  
  const [comment, setComment] = useState('');
=======
import { onValue, push, ref, remove, update } from "firebase/database";
import { useEffect, useRef, useState } from "react";
import "../CSS/Post.css";
import { auth, db } from "./firebase";

const Post = ({ post, currentUser, userRole }) => {
  const [comment, setComment] = useState("");
>>>>>>> upstream/master
  const [showComments, setShowComments] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState(post.content);
<<<<<<< HEAD

  // Ownership check: support both `authorId` (new) and `userId` (older posts)
  // Prefer currentUser passed from parent (App) to avoid re-reading DB on each post
  const currentUid = currentUser?.uid || auth.currentUser?.uid;
  const isAdmin = userRole === 'admin';
  const isPostOwner = !!currentUid && (currentUid === post.authorId || currentUid === post.userId || isAdmin);

  // Listen for real-time updates to likes, shares, and comments
  useEffect(() => {
    // Listen to likes
    const likesRef = ref(db, `posts/${post.id}/likes`);
    const unsubscribeLikes = onValue(likesRef, (snapshot) => {
      if (snapshot.exists()) {
        const likesData = snapshot.val();
        const count = Object.keys(likesData).length;
        setLikesCount(count);
        setIsLiked(!!likesData[auth.currentUser?.uid]);
      } else {
        setLikesCount(0);
        setIsLiked(false);
      }
    });

    // Listen to comments
    const commentsRef = ref(db, `posts/${post.id}/comments`);
    const unsubscribeComments = onValue(commentsRef, (snapshot) => {
      // Comments are updated in real-time through the main Feed component
    });

    return () => {
      unsubscribeLikes();
      unsubscribeComments();
    };
  }, [post.id]);

  const handleLike = async () => {
    const user = auth.currentUser;
    if (!user) return;

    const postLikeRef = ref(db, `posts/${post.id}/likes/${user.uid}`);

    try {
      if (isLiked) {
        await remove(postLikeRef);
        setLikesCount(prev => prev - 1);
      } else {
        await update(postLikeRef, {
          userId: user.uid,
          timestamp: Date.now()
        });
        setLikesCount(prev => prev + 1);
      }
      setIsLiked(!isLiked);
    } catch (error) {
      console.error('Error updating like:', error);
    }
  };

  

  const handleEdit = async () => {
    if (!editedContent.trim()) return;
    try {
      await update(ref(db, `posts/${post.id}`), {
        content: editedContent
      });
      setIsEditing(false);
      setShowMenu(false);
    } catch (error) {
      console.error('Error editing post:', error);
    }
  };

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this post?')) {
      try {
        await remove(ref(db, `posts/${post.id}`));
        setShowMenu(false);
      } catch (error) {
        console.error('Error deleting post:', error);
      }
=======
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
>>>>>>> upstream/master
    }
  };

  const handleComment = async (e) => {
    e.preventDefault();
    if (!comment.trim()) return;

    const user = auth.currentUser;
    if (!user) return;

<<<<<<< HEAD
    try {
      const newComment = {
        userId: user.uid,
        userEmail: user.email,
        content: comment,
        timestamp: Date.now()
      };

      const commentsRef = ref(db, `posts/${post.id}/comments`);
      await push(commentsRef, newComment);
      setComment('');
    } catch (error) {
      console.error('Error adding comment:', error);
    }
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
=======
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
>>>>>>> upstream/master
  };

  return (
    <div className="post-card">
      <div className="post-header">
        <div>
          <div className="post-user">{post.userEmail}</div>
          <div className="post-time">{formatTime(post.timestamp)}</div>
        </div>
<<<<<<< HEAD
        <div className="post-menu-container">
          {isPostOwner && (
            <button className="menu-btn" onClick={() => setShowMenu(!showMenu)}>
              ⋮
            </button>
          )}
          {showMenu && isPostOwner && (
            <div className="post-menu">
              <button onClick={() => setIsEditing(true)} className="menu-item edit-item">
=======

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
>>>>>>> upstream/master
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
<<<<<<< HEAD
            <button onClick={handleEdit} className="edit-save-btn">Save</button>
            <button onClick={() => setIsEditing(false)} className="edit-cancel-btn">Cancel</button>
=======
            <button onClick={handleEdit} className="edit-save-btn">
              Save
            </button>
            <button onClick={handleCancel} className="edit-cancel-btn">
              Cancel
            </button>
>>>>>>> upstream/master
          </div>
        </div>
      ) : (
        <div className="post-content">{editedContent}</div>
      )}

      {post.media && (
<<<<<<< HEAD
        <div className="post-media">
          {post.media.startsWith('data:image') ? (
            <img src={post.media} alt="Post content" />
=======
        <div className={`post-media ${getMediaRatio(post.media)}`}>
          {post.media.startsWith("data:image") ? (
            <img src={post.media} alt="Post" />
>>>>>>> upstream/master
          ) : (
            <video src={post.media} controls />
          )}
        </div>
      )}

<<<<<<< HEAD
      <div className="post-stats">
        <span>{likesCount} {likesCount === 1 ? 'like' : 'likes'}</span>
      </div>

      <div className="post-actions">
        <button 
          className={`action-btn like-btn ${isLiked ? 'liked' : ''}`}
          onClick={handleLike}
        >
          ❤ {likesCount}
        </button>
        <button 
=======
      <div className="post-actions">
        <button
>>>>>>> upstream/master
          className="action-btn comment-btn"
          onClick={() => setShowComments(!showComments)}
        >
          💬 {post.comments ? Object.keys(post.comments).length : 0}
        </button>
<<<<<<< HEAD
        {/* share button removed as requested */}
=======
>>>>>>> upstream/master
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
<<<<<<< HEAD
            {post.comments && Object.entries(post.comments).map(([id, comment]) => (
              <div key={id} className="comment">
                <strong>{comment.userEmail}</strong>
                <p>{comment.content}</p>
                <small>{formatTime(comment.timestamp)}</small>
              </div>
            ))}
=======
            {post.comments &&
              Object.entries(post.comments).map(([id, c]) => (
                <div key={id} className="comment">
                  <strong>{c.userEmail}</strong>
                  <p>{c.content}</p>
                  <small>{formatTime(c.timestamp)}</small>
                </div>
              ))}
>>>>>>> upstream/master
          </div>
        </div>
      )}
    </div>
  );
};

<<<<<<< HEAD
export default Post;
=======
export default Post;
>>>>>>> upstream/master
