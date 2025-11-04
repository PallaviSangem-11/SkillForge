import React, { useEffect, useMemo, useState } from 'react';
import api from '../../api/axiosConfig';
import { useAuth } from '../../auth/useAuth';
import { useNavigate } from 'react-router-dom';

const StudentProgress = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [attempts, setAttempts] = useState([]);
  const [courses, setCourses] = useState([]);
  const [enrolledCourses, setEnrolledCourses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        // Load attempts
        const attemptsRes = await api.get(`/quiz-attempts/student/${user.id}`);
        setAttempts(attemptsRes.data || []);

        // Load courses and enrollments
        const coursesRes = await api.get('/courses/student');
        setCourses(coursesRes.data || []);

        const enrollRes = await api.get(`/enrollments/student/${user.id}`);
        setEnrolledCourses(enrollRes.data || []);
      } catch (e) {
        console.error('Failed to load progress data', e);
      } finally {
        setLoading(false);
      }
    };
    if (user?.id) load();
  }, [user?.id]);

  const overall = useMemo(() => {
    if (!attempts.length) return 0;
    const sum = attempts.reduce((s, a) => s + (a.score || 0), 0);
    return Math.round(sum / attempts.length);
  }, [attempts]);

  const recent = useMemo(() => {
    const sorted = [...attempts].sort((a, b) => new Date(b.attemptedAt) - new Date(a.attemptedAt));
    return sorted.slice(0, 10);
  }, [attempts]);

  const courseWiseStats = useMemo(() => {
    const stats = {};
    enrolledCourses.forEach(enrollment => {
      const courseId = enrollment.course.id;
      const courseAttempts = attempts.filter(a => a.quiz?.course?.id === courseId);
      
      if (courseAttempts.length > 0) {
        const scores = courseAttempts.map(a => a.score || 0);
        const avgScore = scores.reduce((s, score) => s + score, 0) / scores.length;
        const bestScore = Math.max(...scores);
        const lastAttempt = courseAttempts.sort((a, b) => new Date(b.attemptedAt) - new Date(a.attemptedAt))[0];
        
        stats[courseId] = {
          course: enrollment.course,
          avgScore: Math.round(avgScore),
          bestScore: Math.round(bestScore),
          totalAttempts: courseAttempts.length,
          lastScore: Math.round(lastAttempt.score || 0),
          lastAttemptDate: lastAttempt.attemptedAt,
          progress: Math.min(100, Math.round((avgScore / 80) * 100)) // Progress towards 80% mastery
        };
      }
    });
    return stats;
  }, [attempts, enrolledCourses]);

  const recentActivity = useMemo(() => {
    return recent.slice(0, 5).map(attempt => ({
      id: attempt.id,
      type: 'quiz_attempt',
      title: `Completed ${attempt.quiz?.title || 'Quiz'}`,
      course: attempt.quiz?.course?.title || 'Unknown Course',
      score: Math.round(attempt.score || 0),
      date: attempt.attemptedAt,
      quizId: attempt.quiz?.id
    }));
  }, [recent]);

  const learningProgressData = useMemo(() => {
    // Get last 8 attempts for progress graph
    const progressAttempts = recent.slice(0, 8).reverse();
    return progressAttempts.map((attempt, index) => ({
      attempt: index + 1,
      score: Math.round(attempt.score || 0),
      date: new Date(attempt.attemptedAt).toLocaleDateString(),
      course: attempt.quiz?.course?.title || 'Unknown'
    }));
  }, [recent]);

  if (loading) return <div className="text-center py-10">Loading progress...</div>;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Learning Progress</h1>

      {/* Overall Stats */}
      <div className="grid md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow p-5">
          <div className="text-sm text-gray-500">Overall Score</div>
          <div className="text-3xl font-bold text-blue-600">{overall}%</div>
        </div>
        <div className="bg-white rounded-lg shadow p-5">
          <div className="text-sm text-gray-500">Total Attempts</div>
          <div className="text-3xl font-bold text-green-600">{attempts.length}</div>
        </div>
        <div className="bg-white rounded-lg shadow p-5">
          <div className="text-sm text-gray-500">Courses Enrolled</div>
          <div className="text-3xl font-bold text-purple-600">{enrolledCourses.length}</div>
        </div>
        <div className="bg-white rounded-lg shadow p-5">
          <div className="text-sm text-gray-500">Best Score</div>
          <div className="text-3xl font-bold text-orange-600">
            {attempts.length > 0 ? Math.round(Math.max(...attempts.map(a => a.score || 0))) : 0}%
          </div>
        </div>
      </div>

      {/* Learning Progress Graph */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold mb-4">Learning Progress Trend</h2>
        {learningProgressData.length === 0 ? (
          <div className="text-center py-8 text-gray-500">No quiz attempts yet</div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-end justify-between h-48 bg-gray-50 p-4 rounded">
              {learningProgressData.map((point, index) => (
                <div key={index} className="flex flex-col items-center space-y-2">
                  <div className="text-xs text-gray-600 font-medium">{point.score}%</div>
                  <div
                    className="w-8 bg-gradient-to-t from-blue-500 to-blue-300 rounded-t"
                    style={{ height: `${Math.max(8, (point.score / 100) * 140)}px` }}
                    title={`${point.course}: ${point.score}%`}
                  />
                  <div className="text-xs text-gray-500 transform -rotate-45 origin-bottom-left w-16">
                    {point.date}
                  </div>
                </div>
              ))}
            </div>
            <div className="text-xs text-gray-500 text-center">
              Recent quiz attempts (hover bars for details)
            </div>
          </div>
        )}
      </div>

      {/* Course-wise Performance */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold mb-4">Course-wise Performance</h2>
        {Object.keys(courseWiseStats).length === 0 ? (
          <div className="text-center py-8 text-gray-500">No quiz attempts in any course yet</div>
        ) : (
          <div className="space-y-4">
            {Object.values(courseWiseStats).map((stat) => (
              <div key={stat.course.id} className="border rounded-lg p-4">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="font-medium">{stat.course.title}</h3>
                    <p className="text-sm text-gray-600">{stat.totalAttempts} attempt{stat.totalAttempts !== 1 ? 's' : ''}</p>
                  </div>
                  <div className="text-right text-sm">
                    <div>Best: <span className="font-medium text-green-600">{stat.bestScore}%</span></div>
                    <div>Last: <span className="font-medium">{stat.lastScore}%</span></div>
                  </div>
                </div>
                
                <div className="mb-2">
                  <div className="flex justify-between text-sm mb-1">
                    <span>Average Score: {stat.avgScore}%</span>
                    <span>Progress: {stat.progress}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="h-2 rounded-full bg-gradient-to-r from-blue-500 to-green-500"
                      style={{ width: `${stat.progress}%` }}
                    />
                  </div>
                </div>
                
                <div className="text-xs text-gray-500">
                  Last attempt: {new Date(stat.lastAttemptDate).toLocaleDateString()}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Recent Activity</h2>
          <button 
            onClick={() => navigate('/student/quiz-list')}
            className="text-blue-600 hover:text-blue-800 text-sm font-medium"
          >
            Take More Quizzes →
          </button>
        </div>
        
        {recentActivity.length === 0 ? (
          <div className="text-center py-8 text-gray-500">No recent activity</div>
        ) : (
          <div className="space-y-3">
            {recentActivity.map((activity) => (
              <div 
                key={activity.id} 
                className="flex justify-between items-center p-3 border rounded hover:bg-gray-50 cursor-pointer"
                onClick={() => activity.quizId && navigate(`/student/quiz/${activity.quizId}`)}
              >
                <div>
                  <div className="font-medium">{activity.title}</div>
                  <div className="text-sm text-gray-600">{activity.course}</div>
                </div>
                <div className="text-right">
                  <div className={`text-sm font-medium ${
                    activity.score >= 80 ? 'text-green-600' : 
                    activity.score >= 60 ? 'text-yellow-600' : 'text-red-600'
                  }`}>
                    {activity.score}%
                  </div>
                  <div className="text-xs text-gray-500">
                    {new Date(activity.date).toLocaleDateString()}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default StudentProgress;
