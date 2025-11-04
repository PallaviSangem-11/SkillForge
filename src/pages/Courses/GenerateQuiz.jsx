import React, { useState, useEffect } from "react";
import api from "../../api/axiosConfig";
import "./GenerateQuiz.css";

const GenerateQuiz = () => {
  const [selectedCourse, setSelectedCourse] = useState("");
  const [instructorCourses, setInstructorCourses] = useState([]);
  const [topic, setTopic] = useState("");
  const [numQuestions, setNumQuestions] = useState(5);
  const [timeLimit, setTimeLimit] = useState(30);
  const [quiz, setQuiz] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    const fetchInstructorCourses = async () => {
      try {
        const response = await api.get('/courses');
        if (response.data) {
          setInstructorCourses(response.data);
          setError('');
        }
      } catch (err) {
        console.error('Error fetching courses:', err);
        let errorMessage = 'Failed to fetch courses. Please try again.';
        
        if (err.response?.status === 403) {
          errorMessage = 'Access denied. You must be an instructor to access this feature.';
        } else if (err.response?.status === 401) {
          errorMessage = 'Your session has expired. Please log in again.';
        } else if (err.response?.data?.message) {
          errorMessage = err.response.data.message;
        }
        
        setError(errorMessage);
        alert(errorMessage); // Show error in alert
      }
    };
    
    fetchInstructorCourses();
  }, []);

  const handleGenerate = async () => {
    // Validate form inputs
    if (!selectedCourse) {
      setError("Please select a course");
      return;
    }
    if (!topic.trim()) {
      setError("Please enter a topic");
      return;
    }
    if (numQuestions < 1 || numQuestions > 50) {
      setError("Number of questions must be between 1 and 50");
      return;
    }
    if (timeLimit < 5 || timeLimit > 180) {
      setError("Time limit must be between 5 and 180 minutes");
      return;
    }

    setLoading(true);
    setError("");
    setSuccess("");
    setQuiz([]);

    try {
      const response = await api.post("/quiz/generate", {
        topic: topic.trim(),
        courseId: selectedCourse,
        numberOfQuestions: parseInt(numQuestions),
        timeLimitMinutes: parseInt(timeLimit),
        generationType: 'AI'
      }).catch(err => {
        let errorMessage = 'Failed to generate quiz. Please try again.';
        if (err.response?.data?.message) {
          errorMessage = err.response.data.message;
        }
        throw new Error(errorMessage);
      });

      // Process quiz data
      const data = response.data;
      let questions = [];
      
      if (data && data.questions) {
        questions = data.questions.map(q => {
          let options = [];
          try {
            options = q.optionsJson ? JSON.parse(q.optionsJson) : [];
          } catch (e) {
            console.error('Error parsing options:', e);
            options = [];
          }
          return {
            prompt: q.prompt,
            options: options
          };
        });
      }

      if (questions.length === 0) {
        setError("No questions were generated. Please try again with a different topic.");
      } else {
        setQuiz(questions);
        setSuccess("Quiz generated successfully!");
      }
    } catch (err) {
      console.error('Quiz generation error:', err);
      const errorMessage = err.message || "Failed to generate quiz. Please try again.";
      setError(errorMessage);
      alert(errorMessage); // Show error in alert
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="quiz-container">
      <h2>Generate Quiz</h2>

      <div className="quiz-form">
        <div className="form-group">
          <label htmlFor="course">Course</label>
          <select
            id="course"
            value={selectedCourse}
            onChange={(e) => setSelectedCourse(e.target.value)}
            className="form-control"
            disabled={loading}
            required
          >
            <option value="">Select a course</option>
            {instructorCourses.map(course => (
              <option key={course.id} value={course.id}>
                {course.title}
              </option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="topic">Topic</label>
          <input
            id="topic"
            type="text"
            placeholder="e.g. Java Streams, Data Structures"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            className="form-control"
            disabled={loading}
            required
          />
          <small>Enter the topic for which you want to generate questions</small>
        </div>

        <div className="form-group">
          <label htmlFor="numQuestions">Number of Questions</label>
          <input
            id="numQuestions"
            type="number"
            value={numQuestions}
            onChange={(e) => {
              const val = parseInt(e.target.value);
              if (!isNaN(val)) {
                setNumQuestions(Math.min(50, Math.max(1, val)));
              }
            }}
            min={1}
            max={50}
            className="form-control"
            disabled={loading}
            required
          />
          <small>Between 1 and 50 questions</small>
        </div>

        <div className="form-group">
          <label htmlFor="timeLimit">Time Limit (minutes)</label>
          <input
            id="timeLimit"
            type="number"
            value={timeLimit}
            onChange={(e) => {
              const val = parseInt(e.target.value);
              if (!isNaN(val)) {
                setTimeLimit(Math.min(180, Math.max(5, val)));
              }
            }}
            min={5}
            max={180}
            className="form-control"
            disabled={loading}
            required
          />
          <small>Between 5 and 180 minutes</small>
        </div>

        <button 
          onClick={handleGenerate} 
          disabled={loading || !selectedCourse || !topic.trim()}
          className="btn-generate"
        >
          {loading ? "Generating Quiz..." : "Generate Quiz"}
        </button>

        {error && <div className="error-message">{error}</div>}
        {success && <div className="success-message">{success}</div>}
      </div>

      {quiz.length > 0 && (
        <div className="quiz-preview">
          <h3>Generated Quiz Preview</h3>
          {quiz.map((q, index) => (
            <div key={index} className="quiz-question">
              <h4>Question {index + 1}</h4>
              <p className="question-text">{q.prompt}</p>
              {q.options && q.options.length > 0 && (
                <div className="options-list">
                  {q.options.map((opt, i) => (
                    <div key={i} className="option">
                      <span className="option-label">{String.fromCharCode(65 + i)}.</span>
                      <span className="option-text">{opt}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default GenerateQuiz;
