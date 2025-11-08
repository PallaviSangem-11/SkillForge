import React, { useState, useEffect } from "react";
import axios from "axios";
import api from "../../api/axiosConfig";
import "./GenerateQuiz.css";

const GenerateQuiz = () => {
  const [courseId, setCourseId] = useState("");
  const [topic, setTopic] = useState("");
  const [count, setCount] = useState(5);
  const [timeLimit, setTimeLimit] = useState(10);
  const [mode, setMode] = useState("AI"); // "AI" or "MANUAL"
  const [loading, setLoading] = useState(false);
  const [quizData, setQuizData] = useState(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [instructorCourses, setInstructorCourses] = useState([]);
  const [loadingCourses, setLoadingCourses] = useState(true);
  
  // Manual quiz questions state
  const [manualQuestions, setManualQuestions] = useState([
    {
      prompt: "",
      options: ["", "", "", ""],
      correctAnswer: 0, // Index of correct option (0-3)
    },
  ]);

  // Fetch instructor's courses
  useEffect(() => {
    const fetchInstructorCourses = async () => {
      try {
        setLoadingCourses(true);
        const response = await api.get("/courses/instructor");
        setInstructorCourses(response.data || []);
        // Auto-select first course if available
        if (response.data && response.data.length > 0 && !courseId) {
          setCourseId(response.data[0].id.toString());
        }
      } catch (error) {
        console.error("Failed to fetch instructor courses:", error);
        toast.error("Failed to load courses");
      } finally {
        setLoadingCourses(false);
      }
    };
    fetchInstructorCourses();
  }, []);

  // Add a new question to manual quiz
  const addQuestion = () => {
    setManualQuestions([
      ...manualQuestions,
      {
        prompt: "",
        options: ["", "", "", ""],
        correctAnswer: 0,
      },
    ]);
  };

  // Remove a question from manual quiz
  const removeQuestion = (index) => {
    if (manualQuestions.length > 1) {
      setManualQuestions(manualQuestions.filter((_, i) => i !== index));
    }
  };

  // Update question prompt
  const updateQuestionPrompt = (index, prompt) => {
    const updated = [...manualQuestions];
    updated[index].prompt = prompt;
    setManualQuestions(updated);
  };

  // Update question option
  const updateQuestionOption = (questionIndex, optionIndex, value) => {
    const updated = [...manualQuestions];
    updated[questionIndex].options[optionIndex] = value;
    setManualQuestions(updated);
  };

  // Update correct answer index
  const updateCorrectAnswer = (questionIndex, correctIndex) => {
    const updated = [...manualQuestions];
    updated[questionIndex].correctAnswer = Number(correctIndex);
    setManualQuestions(updated);
  };

  const handleGenerate = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");
    setQuizData(null);

    // Validate manual quiz questions
    if (mode === "MANUAL") {
      const invalidQuestions = manualQuestions.filter(
        (q) => !q.prompt.trim() || q.options.some((opt) => !opt.trim())
      );
      if (invalidQuestions.length > 0) {
        setError("Please fill in all question prompts and options before saving.");
        setLoading(false);
        return;
      }
    }

    try {
      const token = localStorage.getItem("token"); // if you use JWT auth
      const payload =
        mode === "AI"
          ? {
              generationType: "AI",
              topic,
              numberOfQuestions: Number(count),
              courseId: courseId ? Number(courseId) : null,
              timeLimitMinutes: Number(timeLimit),
            }
          : {
              generationType: "MANUAL",
              topic,
              courseId: courseId ? Number(courseId) : null,
              timeLimitMinutes: Number(timeLimit),
              questions: manualQuestions.map((q) => ({
                prompt: q.prompt,
                options: q.options,
                correctAnswer: q.options[q.correctAnswer], // Send the actual answer text
              })),
            };

      const response = await axios.post(
        "http://localhost:8080/api/quizzes/generate",
        payload,
        {
          headers: {
            Authorization: token ? `Bearer ${token}` : "",
            "Content-Type": "application/json",
          },
        }
      );

      if (response.data) {
        setQuizData(response.data);
        setSuccess(mode === "AI" ? "Quiz generated successfully!" : "Manual quiz saved successfully! Students enrolled in this course can now access it.");
      } else {
        setError("Failed to generate quiz. Please try again.");
      }
    } catch (err) {
      console.error("Quiz generation error:", err);
      
      // Extract detailed error message
      let errorMessage = "Failed to generate quiz. Please try again.";
      
      if (err.response) {
        // Server responded with error status
        const serverMessage = err.response.data;
        if (typeof serverMessage === 'string') {
          errorMessage = serverMessage;
        } else if (serverMessage && serverMessage.message) {
          errorMessage = serverMessage.message;
        } else {
          errorMessage = `Server error (${err.response.status}): ${JSON.stringify(serverMessage)}`;
        }
      } else if (err.request) {
        // Request was made but no response received
        errorMessage = "No response from server. Please check if the backend is running on port 8080.";
      } else if (err.message) {
        // Error setting up the request
        errorMessage = `Request error: ${err.message}`;
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="generate-quiz-page">
      <div className="generate-quiz-container">
        <h2 className="generate-quiz-title">Generate a Quiz</h2>

        <div className="mode-toggle" style={{ display: "flex", gap: 12, marginBottom: 16 }}>
          <button
            type="button"
            className={mode === "AI" ? "generate-quiz-btn" : "generate-quiz-btn outline"}
            onClick={() => {
              setMode("AI");
              setError("");
              setSuccess("");
              setQuizData(null);
            }}
          >
            Generate using AI
          </button>
          <button
            type="button"
            className={mode === "MANUAL" ? "generate-quiz-btn" : "generate-quiz-btn outline"}
            onClick={() => {
              setMode("MANUAL");
              setError("");
              setSuccess("");
              setQuizData(null);
              // Reset to one empty question when switching to manual
              setManualQuestions([{
                prompt: "",
                options: ["", "", "", ""],
                correctAnswer: 0,
              }]);
            }}
          >
            Create manually
          </button>
        </div>

        <form className="generate-quiz-form" onSubmit={handleGenerate}>
          <div>
            <label className="generate-quiz-label">Course</label>
            {loadingCourses ? (
              <div className="generate-quiz-input">Loading courses...</div>
            ) : instructorCourses.length === 0 ? (
              <div className="generate-quiz-input" style={{ color: "#dc3545" }}>
                No courses available. Please create a course first.
              </div>
            ) : (
              <select
                className="generate-quiz-input"
                value={courseId}
                onChange={(e) => setCourseId(e.target.value)}
                required
                style={{ padding: "10px", borderRadius: "4px", border: "1px solid #ddd" }}
              >
                <option value="">Select a course</option>
                {instructorCourses.map((course) => (
                  <option key={course.id} value={course.id}>
                    {course.title}
                  </option>
                ))}
              </select>
            )}
          </div>

          <div>
            <label className="generate-quiz-label">Topic</label>
            <input
              type="text"
              className="generate-quiz-input"
              placeholder="Enter quiz topic (e.g. OOP, Arrays, etc.)"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              required
            />
          </div>

          {mode === "AI" && (
            <div>
              <label className="generate-quiz-label">Number of Questions</label>
              <input
                type="number"
                className="generate-quiz-input"
                min="1"
                max="50"
                value={count}
                onChange={(e) => setCount(e.target.value)}
                required
              />
            </div>
          )}

          <div>
            <label className="generate-quiz-label">Time Limit (minutes)</label>
            <input
              type="number"
              className="generate-quiz-input"
              min="1"
              max="180"
              value={timeLimit}
              onChange={(e) => setTimeLimit(e.target.value)}
              required
            />
          </div>

          {/* Manual Quiz Question Builder */}
          {mode === "MANUAL" && (
            <div className="manual-questions-section">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                <h3 style={{ margin: 0 }}>Questions ({manualQuestions.length})</h3>
                <button
                  type="button"
                  onClick={addQuestion}
                  className="generate-quiz-btn"
                  style={{ padding: "8px 16px", fontSize: "14px" }}
                >
                  + Add Question
                </button>
              </div>

              {manualQuestions.map((question, qIndex) => (
                <div key={qIndex} className="manual-question-card" style={{ 
                  border: "1px solid #ddd", 
                  borderRadius: "8px", 
                  padding: "20px", 
                  marginBottom: "20px",
                  backgroundColor: "#f9f9f9"
                }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                    <h4 style={{ margin: 0 }}>Question {qIndex + 1}</h4>
                    {manualQuestions.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeQuestion(qIndex)}
                        style={{
                          background: "#dc3545",
                          color: "white",
                          border: "none",
                          borderRadius: "4px",
                          padding: "6px 12px",
                          cursor: "pointer",
                          fontSize: "12px"
                        }}
                      >
                        Remove
                      </button>
                    )}
                  </div>

                  <div style={{ marginBottom: "16px" }}>
                    <label className="generate-quiz-label">Question Text</label>
                    <textarea
                      className="generate-quiz-input"
                      placeholder="Enter your question here..."
                      value={question.prompt}
                      onChange={(e) => updateQuestionPrompt(qIndex, e.target.value)}
                      required
                      rows="3"
                      style={{ width: "100%", resize: "vertical" }}
                    />
                  </div>

                  <div style={{ marginBottom: "16px" }}>
                    <label className="generate-quiz-label">Options</label>
                    {question.options.map((option, oIndex) => (
                      <div key={oIndex} style={{ marginBottom: "8px", display: "flex", alignItems: "center", gap: "8px" }}>
                        <input
                          type="radio"
                          name={`correct-${qIndex}`}
                          checked={question.correctAnswer === oIndex}
                          onChange={() => updateCorrectAnswer(qIndex, oIndex)}
                          style={{ cursor: "pointer" }}
                        />
                        <label style={{ margin: 0, fontWeight: question.correctAnswer === oIndex ? "bold" : "normal" }}>
                          Option {oIndex + 1}:
                        </label>
                        <input
                          type="text"
                          className="generate-quiz-input"
                          placeholder={`Option ${oIndex + 1}`}
                          value={option}
                          onChange={(e) => updateQuestionOption(qIndex, oIndex, e.target.value)}
                          required
                          style={{ flex: 1 }}
                        />
                      </div>
                    ))}
                    <small style={{ color: "#666", marginTop: "8px", display: "block" }}>
                      Select the radio button next to the correct answer
                    </small>
                  </div>
                </div>
              ))}
            </div>
          )}

          <button
            type="submit"
            className="generate-quiz-btn"
            disabled={loading || !courseId || (mode === "AI" && !topic) || (mode === "MANUAL" && manualQuestions.length === 0)}
          >
            {loading ? (mode === "AI" ? "Generating with AI..." : "Saving...") : mode === "AI" ? "Generate Quiz" : "Save Manual Quiz"}
          </button>
        </form>

        {loading && (
          <div className="loader">
            <span></span>
            <span></span>
            <span></span>
          </div>
        )}

        {error && <p className="error-message">{error}</p>}
        {success && <p className="success-message">{success}</p>}

        {quizData && (
          <div className="generated-quiz-section">
            <h3>Generated Quiz Preview</h3>
            <p>
              <strong>Course ID:</strong> {courseId} <br />
              <strong>Topic:</strong> {topic} <br />
              <strong>Questions:</strong> {count} <br />
              <strong>Time Limit:</strong> {timeLimit} minutes
            </p>

            {quizData.questions ? (
              quizData.questions.map((q, index) => {
                const options = Array.isArray(q.options)
                  ? q.options
                  : q.optionsJson
                  ? (() => {
                      try { return JSON.parse(q.optionsJson); } catch { return []; }
                    })()
                  : [];
                const prompt = q.prompt || q.question;
                return (
                <div key={index} className="question-card">
                  <h4>
                    {index + 1}. {prompt}
                  </h4>
                  <ul className="options-list">
                    {options.map((opt, i) => (
                      <li key={i} className="option">
                        {opt}
                      </li>
                    ))}
                  </ul>
                </div>
              );})
            ) : (
              <pre>{JSON.stringify(quizData, null, 2)}</pre>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default GenerateQuiz;
