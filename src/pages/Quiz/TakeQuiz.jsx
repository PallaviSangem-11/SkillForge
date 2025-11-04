import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../api/axiosConfig';
import { toast } from 'react-toastify';
import { useAuth } from '../../auth/useAuth';

const TakeQuiz = () => {
  const { quizId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [quiz, setQuiz] = useState(null);
  const [answers, setAnswers] = useState({});
  const [timeLeft, setTimeLeft] = useState(null);
  const [started, setStarted] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [score, setScore] = useState(null);

  useEffect(() => {
    fetchQuiz();
  }, [quizId]);

  useEffect(() => {
    if (started && timeLeft > 0 && !submitted) {
      const timer = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            handleSubmit();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [started, timeLeft, submitted]);

  const fetchQuiz = async () => {
    try {
  const response = await api.get(`/quizzes/${quizId}`);
      setQuiz(response.data);
      if (response.data.timeLimitMinutes) {
        setTimeLeft(response.data.timeLimitMinutes * 60);
      }
    } catch (error) {
      toast.error('Failed to load quiz');
      navigate(-1);
    }
  };

  const handleStart = () => {
    setStarted(true);
  };

  const handleAnswerChange = (questionId, answer) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: answer,
    }));
  };

  const handleSubmit = async () => {
    if (submitted) return;

    setSubmitted(true);
    try {
      const submission = {
        quizId: quiz.id,
        studentId: user.id,
        answers: answers,
      };

  const response = await api.post('/quiz-attempts/submit', submission);
      setScore(response.data);
      toast.success(`Quiz submitted! Score: ${response.data.score.toFixed(1)}%`);
    } catch (error) {
      toast.error('Failed to submit quiz');
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (!quiz) {
    return <div className="text-center py-8">Loading quiz...</div>;
  }

  if (!started && !submitted) {
    return (
      <div className="max-w-2xl mx-auto bg-white rounded-lg shadow p-8">
        <h2 className="text-2xl font-bold mb-4">{quiz.title}</h2>
        <div className="space-y-4">
          <p className="text-gray-600">Number of questions: {quiz.questions?.length || 0}</p>
          {quiz.timeLimitMinutes && (
            <p className="text-gray-600">Time limit: {quiz.timeLimitMinutes} minutes</p>
          )}
          <button
            onClick={handleStart}
            className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700"
          >
            Start Quiz
          </button>
        </div>
      </div>
    );
  }

  if (submitted && score) {
    return (
      <div className="max-w-2xl mx-auto bg-white rounded-lg shadow p-8">
        <h2 className="text-2xl font-bold mb-4">Quiz Results</h2>
        <div className="space-y-4">
          <div className={`text-center p-6 rounded-lg ${
            score.score >= 80 ? 'bg-green-50' :
            score.score >= 60 ? 'bg-yellow-50' : 'bg-red-50'
          }`}>
            <p className="text-3xl font-bold">{score.score.toFixed(1)}%</p>
            <p className="text-gray-600 mt-2">
              {score.correctAnswers} out of {score.totalQuestions} correct
            </p>
          </div>
          {score.feedback && (
            <div className="bg-gray-50 p-4 rounded">
              <h3 className="font-semibold mb-2">Feedback:</h3>
              <pre className="text-sm whitespace-pre-wrap">{score.feedback}</pre>
            </div>
          )}
          <button
            onClick={() => navigate(-1)}
            className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700"
          >
            Back to Courses
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-lg shadow p-6 mb-4 sticky top-0 z-10">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-bold">{quiz.title}</h2>
          {timeLeft !== null && (
            <div className={`text-lg font-semibold ${
              timeLeft < 60 ? 'text-red-600' : 'text-gray-700'
            }`}>
              Time: {formatTime(timeLeft)}
            </div>
          )}
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6 space-y-6">
        {quiz.questions?.map((question, index) => {
          let options = [];
          try {
            if (question.optionsJson) {
              options = JSON.parse(question.optionsJson);
            }
          } catch (e) {
            console.error('Failed to parse options:', e);
          }

          return (
            <div key={question.id} className="border-b pb-6 last:border-0">
              <h3 className="text-lg font-semibold mb-3">
                Question {index + 1}: {question.prompt}
              </h3>
              {question.type === 'MCQ' && options.length > 0 ? (
                <div className="space-y-2">
                  {options.map((option, optIndex) => (
                    <label
                      key={optIndex}
                      className="flex items-center p-3 border rounded hover:bg-gray-50 cursor-pointer"
                    >
                      <input
                        type="radio"
                        name={`question-${question.id}`}
                        value={option}
                        checked={answers[question.id] === option}
                        onChange={() => handleAnswerChange(question.id, option)}
                        className="mr-3"
                      />
                      <span>{option}</span>
                    </label>
                  ))}
                </div>
              ) : (
                <textarea
                  className="w-full border rounded p-3"
                  rows="4"
                  placeholder="Your answer"
                  value={answers[question.id] || ''}
                  onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                />
              )}
            </div>
          );
        })}

        <button
          onClick={handleSubmit}
          disabled={submitted}
          className="w-full bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 disabled:opacity-50"
        >
          {submitted ? 'Submitting...' : 'Submit Quiz'}
        </button>
      </div>
    </div>
  );
};

export default TakeQuiz;

