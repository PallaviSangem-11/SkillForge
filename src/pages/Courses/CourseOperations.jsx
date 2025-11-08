import React, { useState, useEffect } from 'react';
import api from '../../api/axiosConfig';
import { toast } from 'react-toastify';
import { useAuth } from '../../auth/useAuth';

const CourseOperations = () => {
  const { user } = useAuth();
  const [feedbackSummaries, setFeedbackSummaries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [aiSummary, setAiSummary] = useState(null);
  const [aiRaw, setAiRaw] = useState(null);
  const [generatingSummary, setGeneratingSummary] = useState(false);
  const [courseUpdateSuggestions, setCourseUpdateSuggestions] = useState({});

  useEffect(() => {
    fetchFeedbackSummaries();
  }, []);

  const fetchFeedbackSummaries = async () => {
    try {
      setLoading(true);
      const response = await api.get('/courses/instructor/feedback-summaries');
      setFeedbackSummaries(response.data || []);
    } catch (error) {
      console.error('Failed to fetch feedback summaries:', error);
      toast.error('Failed to load feedback summaries');
    } finally {
      setLoading(false);
    }
  };

  const generateAISummary = async (courseId, allFeedback) => {
    if (!allFeedback || allFeedback.length === 0) {
      toast.info('No feedback available to generate summary');
      return;
    }

    setGeneratingSummary(true);
    try {
      // Create a prompt for AI to summarize feedback
      const feedbackText = allFeedback.join('\n\n---\n\n');
      const prompt = `Analyze the following student feedback for a course and provide:
1. A concise summary of common themes
2. Key strengths mentioned
3. Areas needing improvement
4. Specific actionable recommendations
5. Priority level (High/Medium/Low)

Feedback:\n${feedbackText}

Provide the response in a structured format.`;

      // Call backend AI service
      const response = await api.post('/ai/generate-feedback-summary', {
        feedback: feedbackText,
        prompt
      });

      // Debug: log response so we can see structure while developing
      console.debug('AI summary response:', response);

      // Backend will return { summary: {...}, raw: "..." } where summary is structured if available
      if (response.data && response.data.summary) {
        setAiSummary(response.data.summary);
        setAiRaw(response.data.raw || null);
      } else if (response.data && response.data.raw) {
        // Build a minimal structured summary from raw text
        setAiSummary({
          summary: response.data.raw,
          themes: [],
          strengths: [],
          improvements: [],
          priority: 'Medium'
        });
        setAiRaw(response.data.raw);
      } else {
        // Fallback to simple summary
        const simpleSummary = generateSimpleSummary(allFeedback);
        setAiSummary(simpleSummary);
        setAiRaw(null);
      }
    } catch (error) {
      console.error('Failed to generate AI summary:', error);
      // Fallback: Generate a simple summary locally
      const simpleSummary = generateSimpleSummary(allFeedback);
      setAiSummary(simpleSummary);
      setAiRaw(null);
    } finally {
      setGeneratingSummary(false);
    }
  };

  const generateSimpleSummary = (allFeedback) => {
    const feedbackText = allFeedback.join(' ').toLowerCase();
    const themes = [];
    const strengths = [];
    const improvements = [];

    // Detect themes
    if (feedbackText.includes('difficult') || feedbackText.includes('hard')) {
      themes.push('Difficulty concerns');
      improvements.push('Consider adding more examples or simplifying explanations');
    }
    if (feedbackText.includes('clear') || feedbackText.includes('easy to understand')) {
      strengths.push('Clear explanations');
    }
    if (feedbackText.includes('practice') || feedbackText.includes('more questions')) {
      themes.push('Need for more practice');
      improvements.push('Add more practice questions or quizzes');
    }
    if (feedbackText.includes('time') || feedbackText.includes('duration')) {
      themes.push('Time management concerns');
      improvements.push('Review and adjust time limits for quizzes');
    }

    return {
      themes: themes.length > 0 ? themes : ['General feedback'],
      strengths: strengths.length > 0 ? strengths : ['Keep up the good work'],
      improvements: improvements.length > 0 ? improvements : ['Continue monitoring student progress'],
      priority: themes.length > 2 ? 'High' : themes.length > 0 ? 'Medium' : 'Low'
    };
  };

  const generateUpdateSuggestions = (summary) => {
    if (!summary) return {};

    const suggestions = {
      courseContent: [],
      quizImprovements: [],
      generalActions: []
    };

    if (summary.improvements && summary.improvements.length > 0) {
      summary.improvements.forEach(imp => {
        if (imp.toLowerCase().includes('practice') || imp.toLowerCase().includes('question')) {
          suggestions.quizImprovements.push(imp);
        } else if (imp.toLowerCase().includes('content') || imp.toLowerCase().includes('material')) {
          suggestions.courseContent.push(imp);
        } else {
          suggestions.generalActions.push(imp);
        }
      });
    }

    return suggestions;
  };

  const handleCourseSelect = (courseId) => {
    const summary = feedbackSummaries.find(s => s.courseId === courseId);
    if (summary) {
      setSelectedCourse(summary);
      setAiSummary(null);
      setCourseUpdateSuggestions({});
      
      // Auto-generate summary if feedback exists
      if (summary.allFeedback && summary.allFeedback.length > 0) {
        generateAISummary(courseId, summary.allFeedback);
      }
    }
  };

  const handleApplySuggestion = async (suggestion, type) => {
    try {
      // Here you could implement logic to apply suggestions
      // For now, just show a success message
      toast.success(`Suggestion "${suggestion}" noted. You can implement this update in the course settings.`);
    } catch (error) {
      toast.error('Failed to apply suggestion');
    }
  };

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <p className="mt-2 text-gray-600">Loading course feedback...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-2xl font-bold mb-4">📊 Quiz Recommendation</h2>
        <p className="text-gray-600 mb-6">
          View student feedback, AI-generated summaries, and get quiz recommendation suggestions to improve your assessment strategy.
        </p>

        {/* Course Selection */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Select Course to Analyze
          </label>
          <select
            className="w-full md:w-1/2 border rounded-lg p-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            value={selectedCourse?.courseId || ''}
            onChange={(e) => handleCourseSelect(Number(e.target.value))}
          >
            <option value="">-- Select a course --</option>
            {feedbackSummaries.map((summary) => (
              <option key={summary.courseId} value={summary.courseId}>
                {summary.courseTitle}
              </option>
            ))}
          </select>
        </div>

        {/* Course Cards */}
        {feedbackSummaries.length === 0 ? (
          <div className="text-center py-8 bg-gray-50 rounded-lg">
            <p className="text-gray-500">No courses found. Create courses first to see feedback.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
            {feedbackSummaries.map((summary) => {
              const totalFeedback = summary.feedbackCount + summary.quizFeedbackCount;
              return (
                <div
                  key={summary.courseId}
                  className={`border rounded-lg p-4 cursor-pointer transition-all hover:shadow-lg ${
                    selectedCourse?.courseId === summary.courseId
                      ? 'ring-2 ring-blue-500 border-blue-500 bg-blue-50'
                      : 'border-gray-200'
                  }`}
                  onClick={() => handleCourseSelect(summary.courseId)}
                >
                  <h3 className="font-semibold text-lg mb-2">{summary.courseTitle}</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Total Feedback:</span>
                      <span className="font-medium">{totalFeedback}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Average Score:</span>
                      <span className={`font-medium ${
                        summary.averageScore >= 75 ? 'text-green-600' :
                        summary.averageScore >= 60 ? 'text-yellow-600' : 'text-red-600'
                      }`}>
                        {summary.averageScore.toFixed(1)}%
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Detailed Analysis */}
        {selectedCourse && (
          <div className="space-y-6">
            {/* AI Summary */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-6 border border-blue-200">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold">🤖 AI Feedback Summary</h3>
                <button
                  onClick={() => generateAISummary(selectedCourse.courseId, selectedCourse.allFeedback)}
                  disabled={generatingSummary || !selectedCourse.allFeedback || selectedCourse.allFeedback.length === 0}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {generatingSummary ? 'Generating...' : 'Regenerate Summary'}
                </button>
              </div>

              {generatingSummary && (
                <div className="text-center py-4">
                  <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                  <p className="mt-2 text-sm text-gray-600">Analyzing feedback...</p>
                </div>
              )}

              {aiSummary && (
                <div className="space-y-4">
                  <div className="bg-white rounded-lg p-4">
                    <h4 className="font-semibold mb-2 text-gray-800">📋 Common Themes</h4>
                    <ul className="list-disc list-inside space-y-1 text-sm text-gray-700">
                      {aiSummary.themes && Array.isArray(aiSummary.themes) && aiSummary.themes.length > 0 ? (
                        aiSummary.themes.map((theme, idx) => (
                          <li key={idx}>{theme}</li>
                        ))
                      ) : (
                        <li>{(aiSummary.themes && aiSummary.themes.length === 0) ? 'General feedback' : (aiSummary.themes || 'General feedback')}</li>
                      )}
                    </ul>
                  </div>

                  <div className="bg-white rounded-lg p-4">
                    <h4 className="font-semibold mb-2 text-gray-800">✅ Strengths</h4>
                    <ul className="list-disc list-inside space-y-1 text-sm text-gray-700">
                      {aiSummary.strengths && Array.isArray(aiSummary.strengths) && aiSummary.strengths.length > 0 ? (
                        aiSummary.strengths.map((strength, idx) => (
                          <li key={idx}>{strength}</li>
                        ))
                      ) : (
                        <li>{(aiSummary.strengths && aiSummary.strengths.length === 0) ? 'Keep up the good work' : (aiSummary.strengths || 'Keep up the good work')}</li>
                      )}
                    </ul>
                  </div>

                  <div className="bg-white rounded-lg p-4">
                    <h4 className="font-semibold mb-2 text-gray-800">🔧 Areas for Improvement</h4>
                    <ul className="list-disc list-inside space-y-1 text-sm text-gray-700">
                      {aiSummary.improvements && Array.isArray(aiSummary.improvements) && aiSummary.improvements.length > 0 ? (
                        aiSummary.improvements.map((improvement, idx) => (
                          <li key={idx}>{improvement}</li>
                        ))
                      ) : (
                        <li>{(aiSummary.improvements && aiSummary.improvements.length === 0) ? 'Continue monitoring' : (aiSummary.improvements || 'Continue monitoring')}</li>
                      )}
                    </ul>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-600">Priority:</span>
                    <span className={`px-3 py-1 rounded text-sm font-medium ${
                      aiSummary.priority === 'High' ? 'bg-red-100 text-red-700' :
                      aiSummary.priority === 'Medium' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-green-100 text-green-700'
                    }`}>
                      {aiSummary.priority || 'Low'}
                    </span>
                  </div>
                  {/* Raw AI output for debugging/visibility */}
                  {aiRaw && (
                    <div className="bg-gray-50 rounded p-3 text-sm text-gray-700">
                      <h5 className="font-semibold mb-2">Raw AI output</h5>
                      <pre className="whitespace-pre-wrap">{aiRaw}</pre>
                    </div>
                  )}
                </div>
              )}

              {!aiSummary && !generatingSummary && selectedCourse.allFeedback && selectedCourse.allFeedback.length > 0 && (
                <button
                  onClick={() => generateAISummary(selectedCourse.courseId, selectedCourse.allFeedback)}
                  className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700"
                >
                  Generate AI Summary
                </button>
              )}

              {(!selectedCourse.allFeedback || selectedCourse.allFeedback.length === 0) && (
                <p className="text-gray-500 text-center py-4">No feedback available yet. Wait for students to provide feedback.</p>
              )}
            </div>

            {/* All Feedback */}
            {selectedCourse.allFeedback && selectedCourse.allFeedback.length > 0 && (
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="font-semibold mb-4 text-gray-800">💬 All Student Feedback</h3>
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {selectedCourse.allFeedback.map((feedback, index) => (
                    <div key={index} className="border-l-4 border-blue-400 pl-4 py-2 bg-gray-50 rounded">
                      <p className="text-sm text-gray-700">{feedback}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3">
              <button
                onClick={() => window.location.href = `/instructor/courses`}
                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Edit Course
              </button>
              <button
                onClick={() => window.location.href = `/instructor/quiz`}
                className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition-colors"
              >
                Create New Quiz
              </button>
              <button
                onClick={fetchFeedbackSummaries}
                className="bg-gray-200 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Refresh Data
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CourseOperations;

