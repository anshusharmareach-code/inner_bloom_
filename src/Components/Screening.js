import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import '../CSS/Screening.css';

const Screening = () => {
  const navigate = useNavigate();

  const tests = [
    { title: 'PHQ-9', questions: 9, duration: '~5 minutes', link: '/PHQ9' },
    { title: 'GAD-7', questions: 7, duration: '~3 minutes', link: '/GAD' },
    { title: 'DASS-21', questions: 21, duration: '~10 minutes', link: '/DASS' },
  ];

  const testInfo = [
    {
      title: 'PHQ-9 (Patient Health Questionnaire-9)',
      summary: "This test is a depression screening tool used to monitor the severity of depressive symptoms. It's a quick, 9-question survey that assesses symptoms over the last two weeks, such as changes in sleep, appetite, energy, and mood.",
      details: [
        'Helps identify symptoms of depression.',
        'Takes less than 5 minutes to complete.',
        'Useful for tracking changes over time.',
      ],
    },
    {
      title: 'GAD-7 (Generalized Anxiety Disorder 7-item scale)',
      summary:
        'The GAD-7 is a general anxiety screening tool. It measures the severity of generalized anxiety symptoms over the past two weeks with just 7 questions.',
      details: [
        'Focuses on generalized anxiety symptoms.',
        'Efficient and widely used in clinical practice.',
        'Helps monitor response to treatment.',
      ],
    },
    {
      title: 'DASS-21 (Depression Anxiety Stress Scales)',
      summary:
        'The DASS-21 assesses overall emotional wellbeing, measuring the negative emotional states of depression, anxiety, and stress using 21 questions.',
      details: [
        'Covers multiple emotional health domains.',
        'Provides scores for depression, anxiety, and stress separately.',
        'Best used for overall mental health screening.',
      ],
    },
  ];

  const goBack = () => {
    navigate(-1);
  };

  return (
    <div className="container">
      <button onClick={goBack} className="back-button">
        &larr; Back to Dashboard
      </button>

      <section className="section">
        <h2>Mental Health Assessment</h2>
        <p>
          Our screening tools can help assess your current mental health status. Your responses are
          completely confidential and will help us provide personalized support recommendations.
        </p>

        <div className="test-grid">
          {tests.map((test) => (
            <div className="test-card" key={test.title}>
              <h3>{test.title}</h3>
              <p>Questions: {test.questions}</p>
              <p>Duration: {test.duration}</p>
              <Link to={test.link} className="test-button">
                Start {test.title}
              </Link>
            </div>
          ))}
        </div>

        <p className="important-note">
          <strong>Important:</strong> These screenings are not diagnostic tools.
        </p>
      </section>

      <hr />

      <section className="section">
        <h2>Test Information</h2>
        {testInfo.map((info) => (
          <div className="test-info" key={info.title}>
            <h4>{info.title}</h4>
            <p>{info.summary}</p>
            <ul>
              {info.details.map((detail, index) => (
                <li key={index}>{detail}</li>
              ))}
            </ul>
          </div>
        ))}
      </section>
    </div>
  );
};

export default Screening;
