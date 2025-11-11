import { onAuthStateChanged, signInAnonymously } from "firebase/auth";
import { push, ref, set } from "firebase/database";
import { useEffect, useRef, useState } from "react";
import "../CSS/Gad.css";
import { auth as sharedAuth, db as sharedDb } from "../Components/firebase";

const GAD7 = () => {
  const GAD7_QUESTIONS = [
    "Feeling nervous, anxious, or on edge",
    "Not being able to stop or control worrying",
    "Worrying too much about different things",
    "Trouble relaxing",
    "Being so restless that it's hard to sit still",
    "Becoming easily annoyed or irritable",
    "Feeling afraid as if something awful might happen",
  ];

  const OPTIONS = [
    { value: 0, label: "Not at all" },
    { value: 1, label: "Several days" },
    { value: 2, label: "More than half the days" },
    { value: 3, label: "Nearly every day" },
  ];

  const [answers, setAnswers] = useState(Array(GAD7_QUESTIONS.length).fill(null));
  const [score, setScore] = useState(null);
  const [interpretation, setInterpretation] = useState("");
  const [userId, setUserId] = useState(null);
  const [db, setDb] = useState(null);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const submittingRef = useRef(false);

  useEffect(() => {
    setDb(sharedDb);

    const auth = sharedAuth;
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) setUserId(user.uid);
      else {
        signInAnonymously(auth).then((u) => setUserId(u.user.uid));
      }
      setIsAuthReady(true);
    });

    return () => unsubscribe();
  }, []);

  const interpretGAD7Score = (score) => {
    if (score <= 4) return "Minimal anxiety";
    if (score <= 9) return "Mild anxiety";
    if (score <= 14) return "Moderate anxiety";
    if (score <= 21) return "Severe anxiety";
    return "Invalid score";
  };

  const handleSelect = (questionIndex, optionValue) => {
    const updated = [...answers];
    updated[questionIndex] = optionValue;
    setAnswers(updated);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (answers.includes(null)) {
      alert("Please answer all questions before submitting.");
      return;
    }

    const totalScore = answers.reduce((sum, val) => sum + val, 0);
    const resultInterpretation = interpretGAD7Score(totalScore);

    setScore(totalScore);
    setInterpretation(resultInterpretation);

    if (db && userId) {
      if (hasSubmitted || submittingRef.current) {
        alert('You have already submitted this assessment or submission is in progress.');
        return;
      }
      submittingRef.current = true;
      setIsSubmitting(true);
      try {
        const resultsRef = ref(db, `users/${userId}/assessmentResults`);
        const newResultRef = push(resultsRef);
        await set(newResultRef, {
          testType: "GAD-7",
          score: totalScore,
          resultInterpretation: resultInterpretation,
          timestamp: Date.now(),
          answers
        });
        setHasSubmitted(true);
        console.log("GAD-7 result saved to Realtime Database ✅");
      } catch (error) {
        console.error("Error saving result:", error);
      } finally {
        setIsSubmitting(false);
        submittingRef.current = false;
      }
    }
  };

  if (!isAuthReady) {
    return <div className="gad7-container"><p>Loading...</p></div>;
  }

  return (
    <div className="gad7-container">
      <div className="gad7-card">
        <h2 className="gad7-title">GAD-7 Anxiety Assessment</h2>
        <p className="gad7-subtitle">
          Over the <strong>last two weeks</strong>, how often have you been bothered by the following problems?
        </p>

        <form onSubmit={handleSubmit}>
          {GAD7_QUESTIONS.map((question, qIndex) => (
            <div key={qIndex} className="gad7-question">
              <p className="question-text">
                <span className="question-number">{qIndex + 1}.</span> {question}
              </p>
              <div className="options-container">
                {OPTIONS.map((option) => (
                  <label
                    key={option.value}
                    className={`option-label ${answers[qIndex] === option.value ? "selected" : ""}`}
                    onClick={() => handleSelect(qIndex, option.value)}
                  >
                    <input
                      type="radio"
                      name={`q${qIndex}`}
                      value={option.value}
                      checked={answers[qIndex] === option.value}
                      readOnly
                    />
                    {option.label}
                  </label>
                ))}
              </div>
            </div>
          ))}
          <button
            type="submit"
            className="submit-btn"
            disabled={answers.includes(null) || isSubmitting || hasSubmitted}
          >
            {isSubmitting ? 'Saving...' : hasSubmitted ? 'Already saved' : 'Submit'}
          </button>
        </form>

        {score !== null && (
          <div
            className={`result-box ${
              score <= 4
                ? "score-minimal"
                : score <= 9
                ? "score-mild"
                : score <= 14
                ? "score-moderate"
                : "score-severe"
            }`}
          >
            <h3>Your GAD-7 Results</h3>
            <p><strong>Score:</strong> {score}</p>
            <p><strong>Interpretation:</strong> {interpretation}</p>
            <p className="disclaimer">Disclaimer: This is not a diagnostic tool.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default GAD7;
