import { onAuthStateChanged, signInAnonymously } from 'firebase/auth';
import { push, ref, set } from 'firebase/database';
import { useCallback, useEffect, useRef, useState } from 'react';
import { auth as sharedAuth, db as sharedDb } from '../Components/firebase';
import '../CSS/Phq.css';

const PHQ9_QUESTIONS = [
    "Little interest or pleasure in doing things?",
    "Feeling down, depressed, or hopeless?",
    "Trouble falling or staying asleep, or sleeping too much?",
    "Feeling tired or having little energy?",
    "Poor appetite or overeating?",
    "Feeling bad about yourself — or that you are a failure, or have let yourself or your family down?",
    "Trouble concentrating on things, such as reading or watching TV?",
    "Moving or speaking so slowly that other people could have noticed? Or the opposite — being so fidgety or restless that you have been moving around a lot more than usual?",
    "Thoughts that you would be better off dead, or of hurting yourself in some way?"
];

const OPTIONS = [
    { value: 0, label: "Not at all" },
    { value: 1, label: "Several days" },
    { value: 2, label: "More than half the days" },
    { value: 3, label: "Nearly every day" }
];

const getScoreInterpretation = (score) => {
    if (score <= 4) return { text: "Minimal depression", className: "score-minimal" };
    if (score <= 9) return { text: "Mild depression", className: "score-mild" };
    if (score <= 14) return { text: "Moderate depression", className: "score-moderate" };
    if (score <= 19) return { text: "Moderately severe depression", className: "score-moderately-severe" };
    return { text: "Severe depression", className: "score-severe" };
};

const CustomModal = ({ isOpen, title, message, onClose }) => {
    if (!isOpen) return null;
    return (
        <div className="modal-overlay">
            <div className="modal-box">
                <h3 className="modal-title">{title}</h3>
                <p className="modal-message">{message}</p>
                <button className="modal-btn" onClick={onClose}>OK</button>
            </div>
        </div>
    );
};

const PHQ9Test = () => {
    const [userId, setUserId] = useState(null);
    const [db, setDb] = useState(null);
    const [isAuthReady, setIsAuthReady] = useState(false);
    const [answers, setAnswers] = useState({});
    const [result, setResult] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalContent, setModalContent] = useState({ title: '', message: '' });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [hasSubmitted, setHasSubmitted] = useState(false);
    const submittingRef = useRef(false);

    const showCustomModal = useCallback((title, message) => {
        setModalContent({ title, message });
        setIsModalOpen(true);
    }, []);
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


    const handleChange = useCallback((index, value) => {
        setAnswers(prev => ({
            ...prev,
            [index]: parseInt(value)
        }));
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (Object.keys(answers).length !== PHQ9_QUESTIONS.length) {
            showCustomModal("Missing Answers", "Please answer all questions before submitting.");
            return;
        }

        if (!userId || !db) {
            showCustomModal("Login Required", "Please log in to save your results.");
            return;
        }

        const score = Object.values(answers).reduce((sum, val) => sum + val, 0);
        const interpretation = getScoreInterpretation(score);
        setResult({ score, interpretation });

        if (hasSubmitted) {
            showCustomModal('Already Submitted', 'You have already submitted this assessment.');
            return;
        }
        if (hasSubmitted || submittingRef.current) {
            showCustomModal('Already Submitted', 'You have already submitted this assessment.');
            return;
        }

        
        if (submittingRef.current) {
            showCustomModal('Already submitting', 'Your submission is in progress.');
            return;
        }
        submittingRef.current = true;
        setIsSubmitting(true);
        try {
            const resultsRef = ref(db, `users/${userId}/assessmentResults`);
            const newResultRef = push(resultsRef);
            await set(newResultRef, {
                testType: "PHQ-9",
                score,
                resultInterpretation: interpretation.text,
                timestamp: Date.now(),
                answers
            });
            setHasSubmitted(true);
            showCustomModal("Success", `Your score (${score}) has been saved! Interpretation: ${interpretation.text}`);
        } catch (err) {
            console.error(err);
            showCustomModal("Error", "Failed to save results.");
        } finally {
            setIsSubmitting(false);
            submittingRef.current = false;
        }
    };

    return (
        <div className="phq9-container">
            <div className="phq9-card">
                <h2 className="phq9-title">PHQ-9 Depression Screening</h2>
                <p className="phq9-subtitle">
                    Over the <strong>last two weeks</strong>, how often have you been bothered by any of the following problems?
                </p>

                <form onSubmit={handleSubmit}>
                    {PHQ9_QUESTIONS.map((q, idx) => (
                        <div key={idx} className="phq9-question">
                            <p className="question-text"><span className="question-number">{idx + 1}.</span> {q}</p>
                            <div className="options-container">
                                {OPTIONS.map(opt => (
                                    <label key={opt.value} className={`option-label ${answers[idx] === opt.value ? 'selected' : ''}`}>
                                        <input
                                            type="radio"
                                            name={`q${idx}`}
                                            value={opt.value}
                                            checked={answers[idx] === opt.value}
                                            onChange={() => handleChange(idx, opt.value)}
                                            required
                                        />
                                        {opt.label}
                                    </label>
                                ))}
                            </div>
                        </div>
                    ))}

                    <button type="submit" className="submit-btn" disabled={!isAuthReady || !userId || isSubmitting || hasSubmitted}>
                        {isSubmitting ? 'Saving...' : hasSubmitted ? 'Already saved' : (isAuthReady && userId ? 'Get My Score & Save Results' : 'Loading...')}
                    </button>
                </form>

                {result && (
                    <div className={`result-box ${result.interpretation.className}`}>
                        <h3>Assessment Result</h3>
                        <p><strong>Score:</strong> {result.score} / 27</p>
                        <p><strong>Interpretation:</strong> {result.interpretation.text}</p>
                        <p className="disclaimer">Disclaimer: This is not a diagnostic tool.</p>
                    </div>
                )}
            </div>

            <CustomModal
                isOpen={isModalOpen}
                title={modalContent.title}
                message={modalContent.message}
                onClose={() => setIsModalOpen(false)}
            />
        </div>
    );
};

export default PHQ9Test;
