import { push, ref, serverTimestamp, set } from 'firebase/database';
import { useState } from 'react';
import { auth, db } from '../Components/firebase';
import '../CSS/CreatePostModal.css';

const CreatePostModal = ({ onClose }) => {
  const [content, setContent] = useState('');
  const [mediaFile, setMediaFile] = useState(null);
  const [mediaPreview, setMediaPreview] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setMediaFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setMediaPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!content.trim() && !mediaFile) return;

    setIsSubmitting(true);
    const user = auth.currentUser;

    try {
      // For now, we'll store the media as base64
      // In production, you should use Firebase Storage
      const postData = {
        userId: user.uid,
        userEmail: user.email,
        content,
        media: mediaPreview,
        timestamp: serverTimestamp(),
        likes: {},
        comments: [],
        shares: 0
      };

      const newPostRef = push(ref(db, 'posts'));
      await set(newPostRef, postData);
      onClose();
    } catch (error) {
      console.error('Error creating post:', error);
      alert('Failed to create post. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOverlayClick = (e) => {
    // Only close if clicking directly on the overlay, not its children
    if (e.target.className === 'modal-overlay') {
      onClose();
    }
  };

  return (
    <div className="modal-overlay" onClick={handleOverlayClick}>
      <div className="create-post-modal">
        <div className="modal-header">
          <h3>Create New Post</h3>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        <form onSubmit={handleSubmit}>
          <textarea
            placeholder="Share your thoughts..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            maxLength={500}
          />

          <div className="media-upload">
            <input
              type="file"
              accept="image/*,video/*"
              onChange={handleFileChange}
              id="media-upload"
            />
            <label htmlFor="media-upload">
              📎 Add Photo/Video
            </label>
          </div>

          {mediaPreview && (
            <div className="media-preview">
              {mediaFile?.type.startsWith('image/') ? (
                <img src={mediaPreview} alt="Preview" />
              ) : (
                <video src={mediaPreview} controls />
              )}
              <button
                type="button"
                className="remove-media"
                onClick={() => {
                  setMediaFile(null);
                  setMediaPreview('');
                }}
              >
                Remove
              </button>
            </div>
          )}

          <div className="modal-actions">
            <button
              type="submit"
              className="submit-btn"
              disabled={isSubmitting || (!content.trim() && !mediaFile)}
            >
              {isSubmitting ? 'Posting...' : 'Post'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreatePostModal;