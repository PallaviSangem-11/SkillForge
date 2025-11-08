import React, { useState, useEffect, Fragment } from 'react';
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
  const [feedback, setFeedback] = useState('');
  const [timeLeft, setTimeLeft] = useState(null);
  const [started, setStarted] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [score, setScore] = useState(null);
  const [selectedQuestionForHelp, setSelectedQuestionForHelp] = useState(null);
  const [aiHelpInput, setAiHelpInput] = useState('');
  const [aiHelpResponse, setAiHelpResponse] = useState('');
  const [aiHelpLoading, setAiHelpLoading] = useState(false);

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
        studentFeedback: feedback || null,
      };

  const response = await api.post('/quiz-attempts/submit', submission);
      setScore(response.data);
      toast.success(`Quiz submitted! Score: ${response.data.score.toFixed(1)}%`);
      
      // Store feedback in course feedback table if provided
      if (feedback && feedback.trim() && quiz.course) {
        try {
          await api.post(`/courses/${quiz.course.id}/feedback?userId=${user.id}`, {
            rating: null,
            comments: feedback,
            topics: null
          });
        } catch (feedbackError) {
          console.error('Failed to save feedback:', feedbackError);
          // Don't show error to user as feedback is optional
        }
      }
    } catch (error) {
      toast.error('Failed to submit quiz');
      setSubmitted(false);
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleAskAI = async () => {
    if (!selectedQuestionForHelp) {
      toast.info('Please select a question first');
      return;
    }
    
    if (!aiHelpInput || aiHelpInput.trim().length === 0) {
      toast.info('Please enter your question or request for help.');
      return;
    }
    
    setAiHelpLoading(true);
    setAiHelpResponse('');
    try {
      const question = quiz.questions.find(q => q.id === selectedQuestionForHelp);
      const studentAnswer = answers[selectedQuestionForHelp] || null;
      
      const response = await api.post(`/quiz-attempts/quiz/${quizId}/clarify-question`, {
        questionId: selectedQuestionForHelp,
        query: aiHelpInput || 'Explain this question and the correct answer.',
        studentAnswer: studentAnswer
      });
      
      if (response.data && response.data.explanation) {
        setAiHelpResponse(response.data.explanation);
      } else {
        toast.error('No response received from AI');
      }
    } catch (error) {
      console.error('AI help error:', error);
      const errorMsg = error.response?.data?.message || error.response?.data || error.message || 'Failed to get AI help';
      toast.error(errorMsg);
      setAiHelpResponse('Sorry, I encountered an error. Please try again or check if the Gemini API key is configured.');
    } finally {
      setAiHelpLoading(false);
    }
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
    <div className="max-w-6xl mx-auto">
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-lg shadow p-6 space-y-6">
        {quiz.questions?.map((question, index) => {
          let options = [];
          let isMCQ = false;
          
          try {
            if (question.optionsJson) {
              const parsedOptions = JSON.parse(question.optionsJson);
              if (Array.isArray(parsedOptions) && parsedOptions.length > 0) {
                options = parsedOptions;
                isMCQ = true;
              }
            }
          } catch (e) {
            console.error('Failed to parse options:', e);
          }
          
          // Fallback: if type is MCQ or if we have options, treat as MCQ
          if (question.type === 'MCQ' && options.length > 0) {
            isMCQ = true;
          } else if (!question.type && options.length > 0) {
            // If no type is set but options exist, assume MCQ
            isMCQ = true;
          }

          return (
            <div 
              key={question.id} 
              className={`border-b pb-6 last:border-0 cursor-pointer transition-all ${
                selectedQuestionForHelp === question.id ? 'bg-blue-50 border-blue-300 rounded-lg p-4' : ''
              }`}
              onClick={() => setSelectedQuestionForHelp(question.id)}
            >
              <div className="flex items-start justify-between mb-3">
                <h3 className="text-lg font-semibold flex-1">
                  Question {index + 1}: {question.prompt}
                </h3>
                {selectedQuestionForHelp === question.id && (
                  <span className="ml-2 text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">Selected for AI Help</span>
                )}
              </div>
              {isMCQ && options.length > 0 ? (
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
                      <span>
                        <span className="mr-2 font-semibold text-gray-700">{String.fromCharCode(65 + optIndex)}.</span>
                        {option}
                      </span>
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

        {/* Feedback Field */}
        <div className="border-t pt-6 mt-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Feedback (Optional)
            <span className="text-gray-500 text-xs ml-2">- Your feedback helps improve course content</span>
          </label>
          <textarea
            className="w-full border rounded p-3"
            rows="4"
            placeholder="Share your thoughts about this quiz, course topics, or suggestions for improvement..."
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
          />
        </div>

        <button
          onClick={handleSubmit}
          disabled={submitted}
          className="w-full bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 disabled:opacity-50"
        >
          {submitted ? 'Submitting...' : 'Submit Quiz'}
        </button>
        </div>

        {/* AI Help Sidebar */}
        <div className="bg-white rounded-lg shadow p-6 h-fit sticky top-24">
          <h3 className="font-semibold mb-2 text-lg">🤖 Ask AI for Help</h3>
          <p className="text-sm text-gray-600 mb-4">
            Click on a question to select it, then ask for help or clarification.
          </p>
          
          {selectedQuestionForHelp && (
            <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
              <p className="text-xs text-blue-700 font-medium mb-1">Selected Question:</p>
              <p className="text-sm text-blue-900">
                {quiz.questions.find(q => q.id === selectedQuestionForHelp)?.prompt?.substring(0, 60)}...
              </p>
            </div>
          )}

          <textarea
            className="w-full border rounded p-3 mb-3 text-sm"
            rows={4}
            placeholder="E.g., Why is option B correct? or Explain this concept..."
            value={aiHelpInput}
            onChange={(e) => setAiHelpInput(e.target.value)}
            disabled={!selectedQuestionForHelp}
          />
          
          <button
            onClick={handleAskAI}
            disabled={aiHelpLoading || !selectedQuestionForHelp}
            className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {aiHelpLoading ? 'Thinking...' : 'Get AI Help'}
          </button>

          {aiHelpResponse && (
            <div className="mt-4 bg-gray-50 border rounded-lg p-4">
              <h4 className="font-semibold text-sm mb-2 text-gray-800">AI Explanation:</h4>
              <div className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">
                {aiHelpResponse.split('\n').map((line, idx) => (
                  <Fragment key={idx}>
                    {line}
                    {idx < aiHelpResponse.split('\n').length - 1 && <br />}
                  </Fragment>
                ))}
              </div>
              <button
                onClick={() => {
                  setAiHelpResponse('');
                  setAiHelpInput('');
                }}
                className="mt-3 text-xs text-blue-600 hover:text-blue-800"
              >
                Clear
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TakeQuiz;

