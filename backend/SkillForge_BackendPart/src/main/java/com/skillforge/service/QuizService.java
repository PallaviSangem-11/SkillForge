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
            question.setOptionsJson(toJson(q.getOptions()));
            // QuestionDTO stores the correct answer as a String (`correctAnswer`).
            // Use it directly; if it's missing, fall back to the first option when available.
            String correct = q.getCorrectAnswer();
            if (correct == null && q.getOptions() != null && !q.getOptions().isEmpty()) {
                correct = q.getOptions().get(0);
            }
            question.setCorrectAnswer(correct);
            question.setQuiz(quiz);
            questionList.add(question);
        }
        quiz.setQuestions(questionList);
        return quizRepository.save(quiz);
    }

    // AI Quiz generation
    public Quiz generateQuizFromTopic(String topic, Long instructorId, String geminiApiKey,
                                      Long courseId, Integer timeLimit, Integer questionCount) throws Exception {

        String jsonResponse = geminiService.generateQuizJSON(topic, questionCount, geminiApiKey);

        JsonNode root = mapper.readTree(jsonResponse);
        JsonNode questions = root.get("questions");

        Quiz quiz = new Quiz();
        quiz.setTitle(topic);
        quiz.setCreatedAt(LocalDateTime.now());
        quiz.setInstructor(userRepository.findById(instructorId).orElse(null));
        quiz.setCourse(courseRepository.findById(courseId).orElse(null));
        quiz.setTimeLimitMinutes(timeLimit);

        List<Question> questionList = new ArrayList<>();
        for (JsonNode q : questions) {
            Question question = new Question();
            question.setPrompt(q.get("prompt").asText());
            question.setOptionsJson(q.get("options").toString());
            int correctIdx = q.get("correct").asInt();
            question.setCorrectAnswer(q.get("options").get(correctIdx).asText());
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
