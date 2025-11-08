import React, { useEffect, useMemo, useState, Fragment } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../../api/axiosConfig';
import { useAuth } from '../../auth/useAuth';
import { toast } from 'react-toastify';

const QuizResponse = () => {
  const { quizId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [quiz, setQuiz] = useState(null);
  const [attempts, setAttempts] = useState([]);
  const [selectedAttempt, setSelectedAttempt] = useState(null);
  const [answersMap, setAnswersMap] = useState({});
  const [selectedQuestionId, setSelectedQuestionId] = useState(null);
  const [clarifyInput, setClarifyInput] = useState('');
  const [clarifyLoading, setClarifyLoading] = useState(false);
  const [clarifyResponse, setClarifyResponse] = useState('');
  const [showAttemptList, setShowAttemptList] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const [quizRes, attemptsRes] = await Promise.all([
          api.get(`/quizzes/${quizId}`),
          api.get(`/quiz-attempts/student/${user.id}`)
        ]);
        setQuiz(quizRes.data);
        const quizAttempts = (attemptsRes.data || []).filter(a => a.quiz?.id === Number(quizId));
        
        // Sort by date (newest first)
        quizAttempts.sort((a, b) => new Date(b.attemptedAt) - new Date(a.attemptedAt));
        setAttempts(quizAttempts);
        
        if (quizAttempts.length === 0) {
          toast.info('You have not taken this quiz yet.');
          navigate(`/student/quiz/${quizId}`);
          return;
        }
        
        // Set latest attempt as default
        const latest = quizAttempts[0];
        setSelectedAttempt(latest);
        if (latest.answersJson) {
          try {
            setAnswersMap(JSON.parse(latest.answersJson));
          } catch {
            setAnswersMap({});
          }
        }
      } catch (e) {
        toast.error('Failed to load quiz response');
        navigate(-1);
      }
    })();
  }, [quizId, user?.id]);

  const handleAttemptSelect = (attempt) => {
    setSelectedAttempt(attempt);
    setShowAttemptList(false);
    if (attempt.answersJson) {
      try {
        setAnswersMap(JSON.parse(attempt.answersJson));
      } catch {
        setAnswersMap({});
      }
    }
    setSelectedQuestionId(null);
    setClarifyResponse('');
  };

  const getQuizStats = () => {
    if (attempts.length === 0) return null;
    const scores = attempts.map(a => a.score || 0).filter(s => s > 0);
    if (scores.length === 0) return null;
    return {
      highest: Math.max(...scores),
      lowest: Math.min(...scores),
      average: scores.reduce((a, b) => a + b, 0) / scores.length,
      total: attempts.length
    };
  };

  const stats = getQuizStats();

  const questions = useMemo(() => quiz?.questions || [], [quiz]);

  const handleClarify = async () => {
    if (!selectedQuestionId || !selectedAttempt) {
      toast.info('Select a question to clarify.');
      return;
    }
    if (!clarifyInput || clarifyInput.trim().length === 0) {
      toast.info('Please enter your question or request.');
      return;
    }
    setClarifyLoading(true);
    setClarifyResponse('');
    try {
      const res = await api.post(`/quiz-attempts/${selectedAttempt.id}/clarify`, {
        questionId: selectedQuestionId,
        query: clarifyInput || 'Explain this question and the correct answer simply.'
      });
      
      if (res.data && res.data.explanation) {
        setClarifyResponse(res.data.explanation);
      } else {
        toast.error('No response received from AI');
      }
    } catch (e) {
      console.error('AI clarification error:', e);
      const errorMsg = e.response?.data?.message || e.response?.data || e.message || 'Failed to get AI clarification';
      toast.error(errorMsg);
      setClarifyResponse('Sorry, I encountered an error. Please try again or check if the Gemini API key is configured.');
    } finally {
      setClarifyLoading(false);
    }
  };

  if (!quiz || !selectedAttempt || attempts.length === 0) {
    return <div className="text-center py-8">Loading...</div>;
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Quiz Response</h1>
          <p className="text-gray-600">{quiz.title}</p>
        </div>
        <div className="flex items-center gap-4">
          {stats && (
            <div className="bg-white border rounded-lg p-3 shadow-sm">
              <div className="text-xs text-gray-500 mb-1">Stats (All Attempts)</div>
              <div className="flex gap-4 text-sm">
                <div>
                  <span className="text-gray-600">Highest: </span>
                  <span className="font-semibold text-green-600">{Math.round(stats.highest)}%</span>
                </div>
                <div>
                  <span className="text-gray-600">Avg: </span>
                  <span className="font-semibold text-blue-600">{Math.round(stats.average)}%</span>
                </div>
                <div>
                  <span className="text-gray-600">Lowest: </span>
                  <span className="font-semibold text-red-600">{Math.round(stats.lowest)}%</span>
                </div>
                <div>
                  <span className="text-gray-600">Total: </span>
                  <span className="font-semibold">{stats.total}</span>
                </div>
              </div>
            </div>
          )}
          <div className={`px-4 py-2 rounded-lg ${selectedAttempt.score >= 80 ? 'bg-green-50' : selectedAttempt.score >= 60 ? 'bg-yellow-50' : 'bg-red-50'}`}>
            <div className="text-sm text-gray-600">Current Score</div>
            <div className="text-xl font-semibold">{Math.round(selectedAttempt.score)}%</div>
          </div>
        </div>
      </div>

      {/* Attempt Selection */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold">All Quiz Attempts</h3>
          <button
            onClick={() => setShowAttemptList(!showAttemptList)}
            className="text-sm text-blue-600 hover:text-blue-800"
          >
            {showAttemptList ? 'Hide' : 'Show'} Attempt List
          </button>
        </div>
        
        {showAttemptList && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-60 overflow-y-auto">
            {attempts.map((attempt, idx) => (
              <div
                key={attempt.id}
                onClick={() => handleAttemptSelect(attempt)}
                className={`border rounded-lg p-3 cursor-pointer transition-all ${
                  selectedAttempt.id === attempt.id
                    ? 'bg-blue-50 border-blue-500 ring-2 ring-blue-300'
                    : 'hover:bg-gray-50'
                }`}
              >
                <div className="flex justify-between items-start mb-2">
                  <span className="text-xs text-gray-500">Attempt #{attempts.length - idx}</span>
                  <span className={`text-xs px-2 py-1 rounded ${
                    attempt.score >= 80 ? 'bg-green-100 text-green-700' :
                    attempt.score >= 60 ? 'bg-yellow-100 text-yellow-700' :
                    'bg-red-100 text-red-700'
                  }`}>
                    {Math.round(attempt.score)}%
                  </span>
                </div>
                <div className="text-xs text-gray-600">
                  {new Date(attempt.attemptedAt).toLocaleString()}
                </div>
                {selectedAttempt.id === attempt.id && (
                  <div className="mt-2 text-xs text-blue-600 font-medium">Currently Viewing</div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-lg shadow p-6 space-y-6">
          {questions.map((q, idx) => {
            let options = [];
            try { if (q.optionsJson) options = JSON.parse(q.optionsJson); } catch {}
            const studentAnswer = answersMap[q.id];
            const isCorrect = studentAnswer && q.correctAnswer && studentAnswer.trim().toLowerCase() === q.correctAnswer.trim().toLowerCase();
            return (
              <div key={q.id} className={`border rounded p-4 ${selectedQuestionId === q.id ? 'ring-2 ring-blue-400' : ''}`}
                   onClick={() => setSelectedQuestionId(q.id)}>
                <div className="flex items-start justify-between">
                  <h3 className="font-semibold">Question {idx + 1}</h3>
                  <span className={`text-xs px-2 py-1 rounded ${isCorrect ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {isCorrect ? 'Correct' : 'Incorrect'}
                  </span>
                </div>
                <p className="mt-2 text-gray-800">{q.prompt}</p>
                <div className="mt-3 space-y-2">
                  {options.map((opt, oi) => {
                    const letter = String.fromCharCode(65 + oi);
                    const picked = studentAnswer === opt;
                    const correct = q.correctAnswer === opt;
                    return (
                      <div key={oi} className={`flex items-center p-2 border rounded ${picked ? 'bg-blue-50' : ''}`}>
                        <div className="w-6 text-sm font-semibold text-gray-700">{letter}.</div>
                        <div className="flex-1">{opt}</div>
                        {picked && <span className="ml-2 text-xs text-blue-700">Your choice</span>}
                        {correct && <span className="ml-2 text-xs text-green-700">Correct</span>}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        <div className="bg-white rounded-lg shadow p-6 h-fit sticky top-4">
          <h3 className="font-semibold mb-2">Ask AI for help</h3>
          <p className="text-sm text-gray-600 mb-3">Select a question on the left, ask anything to clarify concepts or reasoning.</p>
          <textarea
            className="w-full border rounded p-3 mb-3"
            rows={5}
            placeholder="E.g., Why is option B correct here?"
            value={clarifyInput}
            onChange={(e) => setClarifyInput(e.target.value)}
          />
          <button
            onClick={handleClarify}
            disabled={clarifyLoading || !selectedQuestionId}
            className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {clarifyLoading ? 'Thinking…' : 'Get Explanation'}
          </button>
          {clarifyResponse && (
            <div className="mt-4 bg-gray-50 border rounded-lg p-4">
              <h4 className="font-semibold text-sm mb-2 text-gray-800">AI Explanation:</h4>
              <div className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">
                {clarifyResponse.split('\n').map((line, idx) => (
                  <Fragment key={idx}>
                    {line}
                    {idx < clarifyResponse.split('\n').length - 1 && <br />}
                  </Fragment>
                ))}
              </div>
              <button
                onClick={() => setClarifyResponse('')}
                className="mt-3 text-xs text-blue-600 hover:text-blue-800"
              >
                Clear
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="flex gap-2">
        <button onClick={() => navigate(`/student/quiz/${quizId}`)} className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700">Retake Quiz</button>
        <button onClick={() => navigate('/student/quiz-list')} className="border px-4 py-2 rounded">Back to Quizzes</button>
      </div>
    </div>
  );
};

export default QuizResponse;


