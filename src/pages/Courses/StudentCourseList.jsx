import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import api from '../../api/axiosConfig';
import { getDifficultyDisplayName, getDifficultyColor } from '../../utils/roles';
import Loader from '../../components/Loader';
import { useAuth } from '../../auth/useAuth';

const StudentCourseList = () => {
  const [courses, setCourses] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();
  const [enrolling, setEnrolling] = useState({}); // map courseId -> bool
  const [enrolledCourseIds, setEnrolledCourseIds] = useState(new Set());
  const [perCourseProgressMap, setPerCourseProgressMap] = useState({});

  // Quiz modal state
  const [activeQuiz, setActiveQuiz] = useState(null); // { courseId, quiz }
  const [answers, setAnswers] = useState({});
  const [submittingAttempt, setSubmittingAttempt] = useState(false);
  const [showReview, setShowReview] = useState(false);
  const [reviewItems, setReviewItems] = useState([]); // [{questionId,prompt,selected,correct,options}]
  const [lastScore, setLastScore] = useState(null);
  const [attempts, setAttempts] = useState([]); // past attempts list

  useEffect(() => {
    fetchCourses();
    if (user?.id) {
      fetchAttempts(user.id);
    }
  }, []);

  const fetchCourses = async () => {
    try {
      const response = await api.get('/courses/student');
      setCourses(response.data);
      // also fetch student enrollments if logged in
      if (user?.id) {
        try {
          const enr = await api.get(`/enrollments/student/${user.id}`);
          const ids = new Set((enr.data || []).map((e) => e.course.id));
          setEnrolledCourseIds(ids);
            // fetch per-course progress for this student
            try {
              const progressRes = await api.get(`/progress/student/${user.id}`);
              const map = {};
              (progressRes.data || []).forEach(p => { map[p.courseId] = p.avgScore || 0; });
              setPerCourseProgressMap(map);
            } catch (pe) {
              console.error('failed to fetch per-course progress', pe);
            }
        } catch (ee) {
          console.error('failed to fetch enrollments', ee);
        }
      }
    } catch (error) {
      toast.error('Failed to fetch courses');
    } finally {
      setIsLoading(false);
    }
  };

  const getCourseAttempts = (courseId) => {
    return (attempts || []).filter(a => a.quiz && a.quiz.course && a.quiz.course.id === courseId);
  };

  const getCourseStats = (courseId) => {
    const list = getCourseAttempts(courseId);
    if (list.length === 0) return { last: null, best: null, avg: perCourseProgressMap[courseId] || 0 };
    const sorted = [...list].sort((a,b) => new Date(b.attemptedAt) - new Date(a.attemptedAt));
    const last = Math.round(sorted[0].score || 0);
    const best = Math.round(list.reduce((m,a) => Math.max(m, a.score || 0), 0));
    const avg = Math.round(perCourseProgressMap[courseId] || (list.reduce((s,a)=>s+(a.score||0),0) / list.length));
    return { last, best, avg };
  };

  const fetchAttempts = async (studentId) => {
    try {
      const res = await api.get(`/quiz-attempts/student/${studentId}`);
      setAttempts(res.data || []);
    } catch (e) {
      // no toast, keep quiet
      console.error('failed to fetch attempts', e);
    }
  };

  const handleEnroll = async (courseId) => {
    try {
      if (!user?.id) {
        toast.error('You must be logged in as a student to enroll');
        return;
      }
      setEnrolling((s) => ({ ...s, [courseId]: true }));
      await api.post(`/enrollments/enroll?courseId=${courseId}&studentId=${user.id}`);
      toast.success('Enrolled successfully');
      // refresh courses (or enrollment list) to reflect changes
      await fetchCourses();
      setEnrolledCourseIds((s) => new Set([...s, courseId]));
    } catch (err) {
      console.error(err);
      const message = err.response?.data || 'Enrollment failed';
      toast.error(message);
    } finally {
      setEnrolling((s) => ({ ...s, [courseId]: false }));
    }
  };

  const handleStartCourse = async (course) => {
    // Generate quiz for the course via API
    try {
      // first check if there's a saved quiz for this course
      const existing = await api.get(`/quizzes/course/${course.id}`);
      let quiz = null;
      if (existing.data && existing.data.length > 0) {
        // pick the latest by createdAt if available
        quiz = existing.data[existing.data.length - 1];
      } else {
        const payload = { topic: course.title, courseId: course.id, generationType: 'AI' };
        const res = await api.post('/quizzes/generate', payload);
        quiz = res.data;
      }
      setActiveQuiz({ courseId: course.id, quiz });
      setAnswers({});
    } catch (err) {
      console.error(err);
      toast.error('Failed to generate quiz');
    }
  };

  const handleSelectAnswer = (qIdx, value) => {
    setAnswers((a) => ({ ...a, [qIdx]: value }));
  };

  const submitAttempt = async () => {
    if (!activeQuiz) return;
    try {
      setSubmittingAttempt(true);
      const quiz = activeQuiz.quiz;
      // compute score naively: compare answers with correctAnswer if present
      let total = quiz.questions.length;
      let correct = 0;
      quiz.questions.forEach((q, idx) => {
        const ans = answers[idx];
        if (!ans) return;
        if (q.correctAnswer && q.correctAnswer === ans) correct++;
      });
      const score = total ? (correct / total) * 100 : 0;

      // Build submission payload expected by backend DTO
      if (!quiz.id) {
        toast.error('Cannot submit: quiz is not persisted');
        return;
      }
      const answersMap = {};
      (quiz.questions || []).forEach((q, idx) => {
        if (answers[idx]) {
          answersMap[q.id] = answers[idx];
        }
      });
      const submission = {
        quizId: quiz.id,
        studentId: user.id,
        answers: answersMap,
      };
      await api.post('/quiz-attempts/submit', submission);
      toast.success(`Quiz submitted — score: ${Math.round(score)}%`);

      // Build client-side review of wrong answers
      const wrong = [];
      (quiz.questions || []).forEach((q, idx) => {
        const sel = answers[idx];
        const corr = q.correctAnswer;
        if (sel && corr && sel !== corr) {
          let opts = [];
          try { opts = q.optionsJson ? JSON.parse(q.optionsJson) : []; } catch {}
          wrong.push({ questionId: q.id, prompt: q.prompt, selected: sel, correct: corr, options: opts });
        }
      });
      setReviewItems(wrong);
      setLastScore(Math.round(score));
      setShowReview(true);
      // refresh per-course progress for the student
      try {
        const progressRes = await api.get(`/progress/student/${user.id}`);
        const map = {};
        (progressRes.data || []).forEach(p => { map[p.courseId] = p.avgScore || 0; });
        setPerCourseProgressMap(map);
      } catch (pe) {
        console.error('failed to refresh progress', pe);
      }
      // refresh attempts list
      fetchAttempts(user.id);
      // Optionally call recommendation endpoint to refresh recommendations
    } catch (err) {
      console.error(err);
      toast.error('Failed to submit attempt');
    } finally {
      setSubmittingAttempt(false);
    }
  };

  const regenerateNextQuiz = async (takeNow) => {
    if (!activeQuiz) return;
    const fb = answers.feedback || '';
    const topic = `${activeQuiz.quiz.title || ''} ${fb}`.trim();
    try {
      const res = await api.post('/quizzes/generate', { topic, courseId: activeQuiz.courseId, generationType: 'AI' });
      const nextQuiz = res.data;
      if (takeNow) {
        setActiveQuiz({ courseId: activeQuiz.courseId, quiz: nextQuiz });
        setAnswers({});
        setShowReview(false);
        toast.success('Next quiz ready');
      } else {
        toast.success('Next quiz generated and saved. You can take it later.');
      }
    } catch (e) {
      console.error(e);
      toast.error('Failed to generate next quiz');
    }
  };

  if (isLoading) {
    return <Loader text="Loading courses..." />;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Available Courses</h1>
      </div>

      {courses.length === 0 ? (
        <div className="card text-center py-12">
          <div className="text-6xl mb-4">📚</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No courses available</h3>
          <p className="text-gray-600">Check back later for new courses</p>
        </div>
      ) : (
        <div className="grid gap-6">
          {courses.map((course) => (
            <div key={course.id} className="card">
              <div className="flex justify-between items-start mb-4">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {course.title}
                  </h3>
                  <p className="text-gray-600 mb-3">{course.description}</p>
                  
                  <div className="flex items-center space-x-4 text-sm text-gray-500 mb-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getDifficultyColor(course.difficultyLevel)}`}>
                      {getDifficultyDisplayName(course.difficultyLevel)}
                    </span>
                    {course.estimatedDuration && (
                      <span>⏱️ {course.estimatedDuration} hours</span>
                    )}
                    <span>👨‍🏫 {course.instructorName}</span>
                  </div>
                </div>
                
                <div className="flex space-x-2 ml-4">
                  {enrolledCourseIds.has(course.id) ? (
                    <button className="btn-secondary" disabled>
                      Enrolled
                    </button>
                  ) : (
                    <button
                      className="btn-primary"
                      onClick={() => handleEnroll(course.id)}
                      disabled={!!enrolling[course.id]}
                    >
                      {enrolling[course.id] ? 'Enrolling...' : 'Enroll'}
                    </button>
                  )}
                    <div className="flex flex-col items-end space-y-2">
                      <button
                        className="btn-primary"
                        onClick={() => handleStartCourse(course)}
                        disabled={!enrolledCourseIds.has(course.id)}
                      >
                        Take Quiz
                      </button>
                      {enrolledCourseIds.has(course.id) && (
                        <div className="w-36 text-right text-sm">
                          <div className="w-full bg-gray-200 rounded-full h-3">
                            <div className="h-3 rounded-full" style={{ width: `${Math.round(perCourseProgressMap[course.id] || 0)}%`, background: (perCourseProgressMap[course.id] || 0) < 50 ? '#f97316' : ((perCourseProgressMap[course.id] || 0) < 80 ? '#fbbf24' : '#10b981') }} />
                          </div>
                          <div className="text-xs text-gray-600 mt-1">Course avg: {Math.round(perCourseProgressMap[course.id] || 0)}%</div>
                        </div>
                      )}
                    </div>
                </div>
              </div>
              
              {course.prerequisites && (
                <div className="bg-gray-50 p-3 rounded-lg">
                  <h4 className="text-sm font-medium text-gray-700 mb-1">Prerequisites:</h4>
                  <p className="text-sm text-gray-600">{course.prerequisites}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Quiz Modal */}
      {activeQuiz && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white w-11/12 md:w-3/4 lg:w-1/2 p-6 rounded-lg max-h-[80vh] overflow-auto">
            <h2 className="text-xl font-semibold mb-4">{showReview ? 'Quiz Review' : (activeQuiz.quiz.title || 'Generated Quiz')}</h2>

            {!showReview ? (
              <div className="space-y-4">
                {(activeQuiz.quiz.questions || []).map((q, idx) => (
                  <div key={idx} className="p-3 border rounded">
                    <p className="font-medium">{idx + 1}. {q.prompt}</p>
                    {q.optionsJson && (
                      <div className="mt-2 space-y-2">
                        {JSON.parse(q.optionsJson).map((opt, i) => (
                          <div key={i}>
                            <label className="inline-flex items-center">
                              <input type="radio" name={`q-${idx}`} value={opt} checked={answers[idx] === opt} onChange={() => handleSelectAnswer(idx, opt)} />
                              <span className="ml-2">{opt}</span>
                            </label>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Feedback (will be used to regenerate quiz)</label>
                  <textarea className="input-field" rows={3} value={answers.feedback || ''} onChange={(e) => setAnswers(a => ({...a, feedback: e.target.value}))} />
                  <div className="mt-2 flex space-x-2">
                    <button className="btn-secondary" onClick={() => regenerateNextQuiz(true)}>Generate Next Quiz From Feedback</button>
                    <button className="btn-primary" onClick={submitAttempt} disabled={submittingAttempt}>{submittingAttempt ? 'Submitting...' : 'Submit'}</button>
                    <button className="btn-secondary" onClick={() => setActiveQuiz(null)}>Close</button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="p-3 bg-gray-50 rounded">Score: <strong>{lastScore}%</strong></div>
                {reviewItems.length === 0 ? (
                  <div className="p-3 border rounded text-green-700">All answers correct! 🎉</div>
                ) : (
                  reviewItems.map((w) => (
                    <div key={w.questionId} className="p-3 border rounded">
                      <p className="font-medium">{w.prompt}</p>
                      <p className="text-sm text-red-600">Your answer: {w.selected}</p>
                      <p className="text-sm text-green-600">Correct answer: {w.correct}</p>
                    </div>
                  ))
                )}

                <div className="flex flex-col md:flex-row md:items-center md:space-x-2 space-y-2 md:space-y-0">
                  <button className="btn-primary" onClick={() => regenerateNextQuiz(true)}>Take Next Quiz Now</button>
                  <button className="btn-secondary" onClick={() => regenerateNextQuiz(false)}>Generate Next Quiz (Take Later)</button>
                  <button className="btn-secondary" onClick={() => setActiveQuiz(null)}>Close</button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Progress: list past attempts grouped by course */}
      {user?.id && (
        <div className="card">
          <h3 className="text-lg font-semibold mb-2">Your Quiz Progress</h3>
          {attempts.length === 0 ? (
            <p className="text-gray-600">No attempts yet.</p>
          ) : (
            <div className="space-y-4">
              {[...new Set((attempts||[]).map(a => a.quiz?.course?.id).filter(Boolean))].map(cid => (
                <div key={cid} className="border rounded p-3">
                  <div className="font-medium mb-2">Course #{cid}</div>
                  {getCourseAttempts(cid).map(a => (
                    <div key={a.id} className="p-2 border rounded mb-2 flex justify-between items-center">
                      <div>
                        <div className="text-sm">Quiz #{a.quiz?.id || a.id}</div>
                        <div className="text-xs text-gray-600">{new Date(a.attemptedAt).toLocaleString()}</div>
                      </div>
                      <div className="text-sm">Score: <strong>{Math.round(a.score || 0)}%</strong></div>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default StudentCourseList;

