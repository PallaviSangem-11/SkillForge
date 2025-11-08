package com.skillforge.service;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.skillforge.dto.QuestionDTO;
import com.skillforge.entity.Question;
import com.skillforge.entity.Quiz;
import com.skillforge.entity.User;
import com.skillforge.repository.CourseRepository;
import com.skillforge.repository.QuestionRepository;
import com.skillforge.repository.QuizRepository;
import com.skillforge.repository.UserRepository;

@Service
public class QuizService {

    @Autowired
    private QuizRepository quizRepository;

    @Autowired
    private QuestionRepository questionRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private CourseRepository courseRepository;

    @Autowired
    private GeminiService geminiService;

    private final ObjectMapper mapper = new ObjectMapper();

    // Get userId from email
    public Long getUserIdByEmail(String email) {
        return userRepository.findByEmail(email)
                .map(User::getId)
                .orElse(null);
    }

    // Manual quiz creation
    public Quiz createManualQuiz(String topic, Long instructorId, Long courseId,
                                 List<QuestionDTO> questions, Integer timeLimitMinutes) {

        Quiz quiz = new Quiz();
        quiz.setTitle(topic);
        quiz.setCreatedAt(LocalDateTime.now());
        quiz.setInstructor(userRepository.findById(instructorId).orElse(null));
        quiz.setCourse(courseRepository.findById(courseId).orElse(null));
        quiz.setTimeLimitMinutes(timeLimitMinutes);

        List<Question> questionList = new ArrayList<>();
        for (QuestionDTO q : questions) {
            Question question = new Question();
            question.setPrompt(q.getPrompt());
            // Enforce MCQ with exactly 4 options
            List<String> options = q.getOptions() != null ? new ArrayList<>(q.getOptions()) : new ArrayList<>();
            if (options.size() > 4) {
                options = options.subList(0, 4);
            }
            question.setOptionsJson(toJson(options));

            String correct = q.getCorrectAnswer();
            if (correct == null && options != null && !options.isEmpty()) {
                correct = options.get(0);
            }

            question.setCorrectAnswer(correct);
            question.setType("MCQ");
            question.setQuiz(quiz);
            questionList.add(question);
        }

        quiz.setQuestions(questionList);
        return quizRepository.save(quiz);
    }

    // ✅ AI Quiz generation
    public Quiz generateQuizFromTopic(String topic, Long instructorId, String geminiApiKey,
                                      Long courseId, Integer timeLimit, Integer questionCount) throws Exception {

        if (geminiApiKey == null || geminiApiKey.isEmpty()) {
            throw new RuntimeException("Gemini API key is not configured. Please set gemini.api.key in application.properties");
        }

        String jsonResponse;
        try {
            jsonResponse = geminiService.generateQuizJSON(topic, questionCount, geminiApiKey);
        } catch (Exception e) {
            throw new RuntimeException("Failed to generate quiz from Gemini API: " + e.getMessage(), e);
        }

        if (jsonResponse == null || jsonResponse.trim().isEmpty()) {
            throw new RuntimeException("Gemini API returned empty response");
        }

        // Parse the cleaned JSON response
        JsonNode quizJson;
        try {
            quizJson = mapper.readTree(jsonResponse);
        } catch (Exception e) {
            throw new RuntimeException(
                "Failed to parse JSON from Gemini response. " +
                "This might indicate the response format is incorrect. " +
                "Raw response (first 500 chars): " + 
                (jsonResponse.length() > 500 ? jsonResponse.substring(0, 500) + "..." : jsonResponse) +
                "\nError: " + e.getMessage(), 
                e
            );
        }
        
        JsonNode questions = quizJson.path("questions");

        if (questions == null || !questions.isArray() || questions.size() == 0) {
            throw new RuntimeException(
                "Quiz JSON missing 'questions' array or array is empty. " +
                "Expected structure: {\"questions\":[...]}. " +
                "Raw response (first 500 chars): " + 
                (jsonResponse.length() > 500 ? jsonResponse.substring(0, 500) + "..." : jsonResponse)
            );
        }

        // Step 3: Build quiz entity
        Quiz quiz = new Quiz();
        quiz.setTitle(topic);
        quiz.setCreatedAt(LocalDateTime.now());
        quiz.setInstructor(userRepository.findById(instructorId).orElse(null));
        quiz.setCourse(courseRepository.findById(courseId).orElse(null));
        quiz.setTimeLimitMinutes(timeLimit);

        List<Question> questionList = new ArrayList<>();
        for (JsonNode q : questions) {
            Question question = new Question();
            question.setPrompt(q.path("prompt").asText());
            // Enforce MCQ with exactly 4 options
            JsonNode optionsNode = q.path("options");
            List<String> options = new ArrayList<>();
            if (optionsNode.isArray()) {
                for (int i = 0; i < optionsNode.size() && i < 4; i++) {
                    options.add(optionsNode.get(i).asText());
                }
            }
            // If fewer than 4 provided, keep as-is; UI will still render safely
            question.setOptionsJson(toJson(options));

            int correctIdx = q.path("correct").asInt();
            if (!options.isEmpty() && correctIdx >= 0 && correctIdx < options.size()) {
                question.setCorrectAnswer(options.get(correctIdx));
            } else {
                question.setCorrectAnswer("");
            }

            question.setType("MCQ");
            question.setQuiz(quiz);
            questionList.add(question);
        }

        quiz.setQuestions(questionList);
        return quizRepository.save(quiz);
    }

    private String toJson(Object obj) {
        try {
            return mapper.writeValueAsString(obj);
        } catch (Exception e) {
            return "[]";
        }
    }

    public List<Quiz> getQuizzesByInstructor(Long id) {
        return quizRepository.findByInstructorId(id);
    }

    public List<Quiz> getQuizzesByCourse(Long id) {
        return quizRepository.findByCourseId(id);
    }

    public Quiz getQuizById(Long id) {
        return quizRepository.findById(id).orElse(null);
    }
}
