import { push, ref, remove, update } from 'firebase/database';
import { useState } from 'react';
import '../CSS/Post.css';
import { auth, db } from './firebase';

const Post = ({ post }) => {
  const [isLiked, setIsLiked] = useState(
    post.likes && post.likes[auth.currentUser?.uid]
  );
  const [likesCount, setLikesCount] = useState(
    post.likes ? Object.keys(post.likes).length : 0
  );
  const [comment, setComment] = useState('');
  const [showComments, setShowComments] = useState(false);

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

  const handleShare = async () => {
    try {
      await update(ref(db, `posts/${post.id}`), {
        shares: (post.shares || 0) + 1
      });
    } catch (error) {
      console.error('Error updating shares:', error);
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
        <div className="post-user">{post.userEmail}</div>
        <div className="post-time">{formatTime(post.timestamp)}</div>
      </div>

      <div className="post-content">{post.content}</div>

      {post.media && (
        <div className="post-media">
          {post.media.startsWith('data:image') ? (
            <img src={post.media} alt="Post content" />
          ) : (
            <video src={post.media} controls />
          )}
        </div>
      )}

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
        <button 
          className="action-btn share-btn"
          onClick={handleShare}
        >
          🔄 {post.shares || 0}
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