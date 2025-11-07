import React, { useState, useEffect } from 'react';
import { auth as sharedAuth, db as sharedDb } from '../Components/firebase';
import { onAuthStateChanged, signInAnonymously } from 'firebase/auth';
import { ref, push, set } from 'firebase/database';
import '../CSS/Das.css';

const DASS21_QUESTIONS = {
  Depression: [
    "I couldn't seem to experience any positive feeling at all",
    "I felt that I had nothing to look forward to",
    "I felt down-hearted and blue",
    "I felt I wasn't worth much as a person",
    "I felt that I was unable to become enthusiastic about anything",
    "I felt that life was meaningless",
    "I felt that I had nothing to look forward to"
  ],
  Anxiety: [
    "I experienced breathing difficulty (e.g., rapid breathing, breathlessness)",
    "I felt scared without any good reason",
    "I felt that I was close to panic",
    "I was aware of the action of my heart in the absence of physical exertion",
    "I felt I was using a lot of nervous energy",
    "I felt restless or agitated",
    "I experienced trembling (e.g., in the hands)"
  ],
  Stress: [
    "I found it hard to wind down",
    "I tended to over-react to situations",
    "I felt that I was using a lot of nervous energy",
    "I found myself getting agitated",
    "I found it difficult to relax",
    "I was intolerant of anything that kept me from getting on with what I was doing",
    "I experienced difficulty in concentrating on tasks"
  ]
};


const calculateScore = (answers) => answers.reduce((acc, curr) => acc + curr, 0) * 2;

const interpretScore = (subscale, score) => {
  const levels = {
    Depression: [
      [0, 9, "Normal"],
      [10, 13, "Mild"],
      [14, 20, "Moderate"],
      [21, 27, "Severe"],
      [28, Infinity, "Extremely Severe"]
    ],
    Anxiety: [
      [0, 7, "Normal"],
      [8, 9, "Mild"],
      [10, 14, "Moderate"],
      [15, 19, "Severe"],
      [20, Infinity, "Extremely Severe"]
    ],
    Stress: [
      [0, 14, "Normal"],
      [15, 18, "Mild"],
      [19, 25, "Moderate"],
      [26, 33, "Severe"],
      [34, Infinity, "Extremely Severe"]
    ]
  };

  for (const [min, max, label] of levels[subscale]) {
    if (score >= min && score <= max) return label;
  }

  return "Invalid score";
};

const DASS21Form = () => {
  const [responses, setResponses] = useState({});
  const [results, setResults] = useState(null);
  const [userId, setUserId] = useState(null);
  const [db, setDb] = useState(null);
  const [isAuthReady, setIsAuthReady] = useState(false);

  useEffect(() => {
    setDb(sharedDb);
    const auth = sharedAuth;
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) setUserId(user.uid);
      else {
        signInAnonymously(auth).then(u => setUserId(u.user.uid));
      }
      setIsAuthReady(true);
    });
    return () => unsubscribe();
  }, []);

  const handleChange = (subscale, index, value) => {
    setResponses(prev => ({
      ...prev,
      [subscale]: {
        ...prev[subscale],
        [index]: parseInt(value)
      }
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const output = {};

    for (const subscale of Object.keys(DASS21_QUESTIONS)) {
      const answers = responses[subscale] || {};
      const values = Object.values(answers);

      if (values.length !== 7) {
        alert(`Please answer all ${subscale} questions.`);
        return;
      }

      const score = calculateScore(values);
      const interpretation = interpretScore(subscale, score);
      output[subscale] = { score, interpretation };
    }

    setResults(output);

    
    if (db && userId) {
      try {
        const resultsRef = ref(db, `users/${userId}/assessmentResults`);
        const newResultRef = push(resultsRef);
        await set(newResultRef, {
          testType: "DASS-21",
          results: output,
          timestamp: Date.now(),
          answers: responses
        });
        console.log("DASS-21 result saved to Realtime Database ✅");
      } catch (error) {
        console.error("Error saving result:", error);
      }
    }
  };

  return (
    <div className="dass21-container">
      <h2>DASS-21 Assessment</h2>
      <form onSubmit={handleSubmit}>
        {Object.entries(DASS21_QUESTIONS).map(([subscale, questions]) => (
          <div key={subscale} className={`subscale-card ${subscale.toLowerCase()}`}>
            <h3>{subscale}</h3>
            {questions.map((question, index) => (
              <div key={index} className="question">
                <p>{index + 1}. {question}</p>
                <div className="options">
                  {[0, 1, 2, 3].map(value => (
                    <label key={value}>
                      <input
                        type="radio"
                        name={`${subscale}-${index}`}
                        value={value}
                        required
                        checked={responses[subscale]?.[index] === value}
                        onChange={() => handleChange(subscale, index, value)}
                      /> {value}
                    </label>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ))}
        <button type="submit">Submit</button>
      </form>

      {results && (
        <div id="result" className="results">
          <h3>Your DASS-21 Results</h3>
          {Object.entries(results).map(([subscale, { score, interpretation }]) => (
            <p key={subscale}>
              <strong>{subscale}:</strong> Score = {score} ({interpretation})
            </p>
          ))}
        </div>
      )}
    </div>
  );
};

export default DASS21Form;
