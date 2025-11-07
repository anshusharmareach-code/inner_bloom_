import { Link, useNavigate } from 'react-router-dom';
import '../CSS/Home.css';
import Feed from './Feed';

const Home = ({ isLoggedIn, showAccessModal }) => {
  const navigate = useNavigate();

  const handleFeatureClick = (e, featureName) => {
    e.preventDefault();
    if (featureName === 'Screening Test') {
      console.log("Navigating to Screening Test...");
      navigate('/Screening'); 
      return;
    }
    if (!isLoggedIn) {
      showAccessModal("Please log in to use this feature.");
    } else {
      console.log(`Navigating to ${featureName}...`);
      alert(`Accessing ${featureName}!`);
    }
  };

  return (
    <main className="main-dashboard">
      {}
      <section className="feed-column">
        {isLoggedIn ? (
          <Feed />
        ) : (
          <>
            <h2 className="column-title">Community Feed</h2>
            <p className="feed-subtitle">Inspiration and support from our mental health community</p>
            <div className="quote-card">
              <p className="quote-text">"Your mental health is a priority. Your happiness is essential. Your self-care is a necessity."</p>
            </div>
          </>
        )}
      </section>

      {}
      <section className="features-column">
        <h2 className="column-title">Your Wellness Toolkit</h2>
        <p className="feed-subtitle">
          Interactive tools designed to support your mental health journey
        </p>
        <ul className="features-list">
          <li>
            <Link
              to="/Screening"
              onClick={(e) => handleFeatureClick(e, 'Screening Test')}
              className="feature-link unlocked"
            >
               Mental Health Screening
            </Link>
          </li>

          <li>
            <a href="#" onClick={(e) => handleFeatureClick(e, 'Games')} className="feature-link locked">
               Games
            </a>
          </li>
          <li>
            <a href="#" onClick={(e) => handleFeatureClick(e, 'Music')} className="feature-link locked">
               Music
            </a>
          </li>
          <li>
            <a href="#" onClick={(e) => handleFeatureClick(e, 'Exercises')} className="feature-link locked">
               Exercises
            </a>
          </li>
          <li>
            <a href="#" onClick={(e) => handleFeatureClick(e, 'Video Links')} className="feature-link locked">
              ▶ Video Links (YouTube)
            </a>
          </li>
        </ul>
      </section>
    </main>
  );
};

export default Home;
