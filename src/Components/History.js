import { onAuthStateChanged } from 'firebase/auth';
import { off, onValue, ref } from 'firebase/database';
import { useEffect, useState } from 'react';
import '../CSS/History.css';
import { auth as sharedAuth, db as sharedDb } from './firebase';

const History = () => {
  const [userId, setUserId] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [results, setResults] = useState([]);
  const [error, setError] = useState('');
  const [isLive, setIsLive] = useState(false);

  useEffect(() => {
    const auth = sharedAuth;
    const db = sharedDb;
    let unsubscribeResults = null;
    let resultsRef = null;

    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      if (user) {
        setUserId(user.uid);
        setIsLoading(true);

        resultsRef = ref(db, `users/${user.uid}/assessmentResults`);

        unsubscribeResults = onValue(
          resultsRef,
          (snapshot) => {
            const data = snapshot.val();
            if (data) {
              const resultsData = Object.entries(data)
                .map(([id, result]) => ({
                  id,
                  ...result,
                }))
                .sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
              setResults(resultsData);
            } else {
              setResults([]);
            }
            setIsLoading(false);
            setIsLive(true);
          },
          (error) => {
            console.error('Error fetching results:', error);
            setError('Failed to load your test history. Please try again.');
            setIsLoading(false);
            setIsLive(false);
          }
        );
      } else {
        setUserId(null);
        setResults([]);
        setIsLoading(false);
        if (unsubscribeResults && resultsRef) {
          off(resultsRef, 'value', unsubscribeResults);
        }
      }
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeResults && resultsRef) {
        off(resultsRef, 'value', unsubscribeResults);
      }
    };
  }, []);

  const formatDate = (timestamp) => {
    if (!timestamp) return 'Unknown date';

    let date;
    if (timestamp.toMillis) {
      date = new Date(timestamp.toMillis());
    } else {
      date = new Date(timestamp);
    }

    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getScoreColor = (testType, score) => {
    const numScore = Number(score);
    if (testType === 'PHQ-9') {
      if (numScore <= 4) return 'score-minimal';
      if (numScore <= 9) return 'score-mild';
      if (numScore <= 14) return 'score-moderate';
      if (numScore <= 19) return 'score-moderately-severe';
      return 'score-severe';
    }
    if (testType === 'GAD-7') {
      if (numScore <= 4) return 'score-minimal';
      if (numScore <= 9) return 'score-mild';
      if (numScore <= 14) return 'score-moderate';
      return 'score-severe';
    }
    return 'score-minimal';
  };

  const renderDASSResults = (results) => {
    if (!results) return null;

    return (
      <div className="dass-results">
        {Object.entries(results).map(([subscale, { score, interpretation }]) => (
          <div key={subscale} className="dass-subscale">
            <span className="subscale-name">{subscale}:</span>
            <span className="subscale-score">{score}</span>
            <span className="subscale-interpretation">({interpretation})</span>
          </div>
        ))}
      </div>
    );
  };



  if (isLoading) {
    return <div className="history-container"><div className="loading">Loading your test history...</div></div>;
  }

  if (error) {
    return <div className="history-container"><div className="error">{error}</div></div>;
  }

  return (
    <div className="history-container">
      <div className="history-header">
        <h2>Your Test History</h2>
      </div>

      {results.length === 0 ? (
        <div className="no-results">
          <p>No test results found. Complete some assessments to see your history here.</p>
        </div>
      ) : (
        <div className="results-list">
          {results.map((result) => (
            <div key={result.id} className="result-card">
              <div className="result-header">
                <h3>{result.testType}</h3>
                <span className="result-date">
                  {formatDate(result.timestamp || result.createdAt)}
                </span>
              </div>
              <div className="result-content">
                {result.testType === 'DASS-21' ? (
                  renderDASSResults(result.results)
                ) : (
                  <>
                    <div className="score-section">
                      <span className="score-label">Score:</span>
                      <span className={`score-value ${getScoreColor(result.testType, result.score || result.totalScore)}`}>
                        {result.score || result.totalScore}
                      </span>
                    </div>
                    <div className="interpretation-section">
                      <span className="interpretation-label">Interpretation:</span>
                      <span className="interpretation-value">
                        {result.resultInterpretation || result.interpretation}
                      </span>
                    </div>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default History;
