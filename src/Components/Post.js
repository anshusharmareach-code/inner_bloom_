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
  const [showComments, setShowComments] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState(post.content);

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
    }
  };

  const handleComment = async (e) => {
    e.preventDefault();
    if (!comment.trim()) return;

    const user = auth.currentUser;
    if (!user) return;

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
  };

  return (
    <div className="post-card">
      <div className="post-header">
        <div>
          <div className="post-user">{post.userEmail}</div>
          <div className="post-time">{formatTime(post.timestamp)}</div>
        </div>
        <div className="post-menu-container">
          {isPostOwner && (
            <button className="menu-btn" onClick={() => setShowMenu(!showMenu)}>
              ⋮
            </button>
          )}
          {showMenu && isPostOwner && (
            <div className="post-menu">
              <button onClick={() => setIsEditing(true)} className="menu-item edit-item">
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
            <button onClick={handleEdit} className="edit-save-btn">Save</button>
            <button onClick={() => setIsEditing(false)} className="edit-cancel-btn">Cancel</button>
          </div>
        </div>
      ) : (
        <div className="post-content">{editedContent}</div>
      )}

      {post.media && (
        <div className="post-media">
          {post.media.startsWith('data:image') ? (
            <img src={post.media} alt="Post content" />
          ) : (
            <video src={post.media} controls />
          )}
        </div>
      )}

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
          className="action-btn comment-btn"
          onClick={() => setShowComments(!showComments)}
        >
          💬 {post.comments ? Object.keys(post.comments).length : 0}
        </button>
        {/* share button removed as requested */}
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
            {post.comments && Object.entries(post.comments).map(([id, comment]) => (
              <div key={id} className="comment">
                <strong>{comment.userEmail}</strong>
                <p>{comment.content}</p>
                <small>{formatTime(comment.timestamp)}</small>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default Post;