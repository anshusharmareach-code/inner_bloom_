import { onValue, ref } from 'firebase/database';
import { useEffect, useState } from 'react';
import '../CSS/Feed.css';
import CreatePostModal from '../Modals/CreatePostModal';
import { db } from './firebase';
import Post from './Post';


const Feed = ({ currentUser, userRole }) => {
  const [posts, setPosts] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const postsRef = ref(db, 'posts');
    const unsubscribe = onValue(postsRef, (snapshot) => {
      if (snapshot.exists()) {
        const postsData = snapshot.val();
        const postsArray = Object.entries(postsData).map(([id, post]) => ({
          id,
          ...post,
        })).sort((a, b) => b.timestamp - a.timestamp);
        setPosts(postsArray);
      } else {
        setPosts([]);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleOpenModal = () => {
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  // Only users and counsellors can see the feed
  if (userRole === 'admin') {
    return <div className="feed-loading">Admins do not have access to the community feed.</div>;
  }

  if (loading) {
    return <div className="feed-loading">Loading feed...</div>;
  }

  return (
    <div className="feed-container">
      <div className="feed-header">
        <h2>Community Feed</h2>
        <button className="create-post-btn" onClick={handleOpenModal}>
          <span className="plus-icon">+</span>
          <span className="btn-text">Create Post</span>
        </button>
      </div>

      <div className="posts-grid">
        {posts.map(post => (
          <Post key={post.id} post={post} />
        ))}
      </div>

      {isModalOpen && (
        <CreatePostModal onClose={handleCloseModal} />
      )}
    </div>
  );
};

export default Feed;