package com.skillforge.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/ai")
@CrossOrigin(origins = "http://localhost:3000")
public class AIController {

    @Value("${gemini.api.key}")
    private String geminiApiKey;

    private final ObjectMapper objectMapper = new ObjectMapper();

    @PostMapping("/gemini-generate-quiz")
    public ResponseEntity<?> generateGeminiQuiz(@RequestBody Map<String, Object> request) {
        try {
            String topic = (String) request.get("topic");
            Integer questionCount = (Integer) request.get("questionCount");
            String difficulty = (String) request.get("difficulty");
            String courseContext = (String) request.get("courseContext");
            String prompt = (String) request.get("prompt");

            if (topic == null || questionCount == null) {
                return ResponseEntity.badRequest().body("Missing required fields: topic, questionCount");
            }

            if (geminiApiKey == null || geminiApiKey.isEmpty()) {
                return ResponseEntity.badRequest().body("Gemini API key not configured");
            }

            // Generate quiz using Gemini AI
            Map<String, Object> quizData = generateQuizWithGemini(topic, questionCount, difficulty, courseContext, prompt);
            return ResponseEntity.ok(quizData);

        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Error generating quiz: " + e.getMessage());
        }
    }

    private Map<String, Object> generateQuizWithGemini(String topic, Integer questionCount, String difficulty, String courseContext, String prompt) throws Exception {
        String apiUrl = "https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent";
        
        // Use the provided prompt or create a default one
        String aiPrompt = prompt != null ? prompt : String.format(
            "Generate %d multiple choice quiz questions EXCLUSIVELY about '%s' for %s level students. " +
            "CRITICAL REQUIREMENTS: " +
            "- Every question must be SPECIFICALLY about '%s' - not general concepts " +
            "- Test practical understanding and real-world application of '%s' " +
            "- Each question has exactly 4 options with only one correct answer " +
            "- Questions should be challenging but appropriate for %s level " +
            "- Focus on the most important aspects of '%s' " +
            "RESPONSE FORMAT - Return ONLY valid JSON array: " +
            "[{\"prompt\":\"Question about %s?\",\"options\":[\"Option 1\",\"Option 2\",\"Option 3\",\"Option 4\"],\"correctAnswer\":\"Option 1\",\"type\":\"MCQ\"}] " +
            "Generate %d questions specifically about '%s' now. Return only the JSON array:",
            questionCount, topic, difficulty, topic, topic, difficulty, topic, topic, questionCount, topic);

        Map<String, Object> payload = Map.of(
            "contents", List.of(Map.of(
                "parts", List.of(Map.of("text", aiPrompt))
            )),
            "generationConfig", Map.of(
                "temperature", 0.7,
                "topK", 40,
                "topP", 0.95,
                "maxOutputTokens", 2000
            )
        );

        String requestBody = objectMapper.writeValueAsString(payload);

        HttpClient client = HttpClient.newHttpClient();
        HttpRequest httpRequest = HttpRequest.newBuilder()
                .uri(URI.create(apiUrl + "?key=" + geminiApiKey))
                .header("Content-Type", "application/json")
                .POST(HttpRequest.BodyPublishers.ofString(requestBody))
                .build();

        HttpResponse<String> response = client.send(httpRequest, HttpResponse.BodyHandlers.ofString());

        if (response.statusCode() >= 200 && response.statusCode() < 300) {
            var root = objectMapper.readTree(response.body());
            var candidates = root.path("candidates");
            if (candidates.isArray() && candidates.size() > 0) {
                String generatedText = candidates.get(0).path("content").path("parts").get(0).path("text").asText("");
                
                // Return the generated text for frontend to parse
                return Map.of(
                    "generatedText", generatedText,
                    "topic", topic,
                    "difficulty", difficulty,
                    "questionCount", questionCount,
                    "success", true
                );
            }
        }
        
        throw new Exception("Failed to generate quiz with Gemini API. Status: " + response.statusCode());
    }

    @PostMapping("/explain")
    public ResponseEntity<?> explainAnswer(@RequestBody Map<String, Object> request) {
        try {
            String prompt = (String) request.get("prompt");
            String selected = (String) request.get("selected");
            String correct = (String) request.get("correct");
            String courseTitle = (String) request.get("courseTitle");
            String topic = (String) request.get("topic");

            if (prompt == null || selected == null || correct == null) {
                return ResponseEntity.badRequest().body("Missing required fields: prompt, selected, correct");
            }

            String explanation = generateExplanation(prompt, selected, correct, courseTitle, topic);
            return ResponseEntity.ok(Map.of("explanation", explanation));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Error generating explanation: " + e.getMessage());
        }
    }

    private String generateExplanation(String prompt, String selected, String correct, String courseTitle, String topic) {
        try {
            String aiPrompt = String.format(
                "You are an educational AI tutor. A student answered a quiz question incorrectly. " +
                "Provide a clear, helpful explanation of why their answer was wrong and why the correct answer is right. " +
                "Be encouraging and educational.\n\n" +
                "Question: %s\n" +
                "Student's Answer: %s\n" +
                "Correct Answer: %s\n" +
                "Course: %s\n" +
                "Topic: %s\n\n" +
                "Provide a concise but thorough explanation (2-3 sentences):",
                prompt, selected, correct, courseTitle != null ? courseTitle : "General", topic != null ? topic : "General"
            );

            Map<String, Object> payload = Map.of(
                "contents", List.of(Map.of(
                    "role", "user",
                    "parts", List.of(Map.of("text", aiPrompt))
                ))
            );

            String requestBody = objectMapper.writeValueAsString(payload);
            String apiUrl = "https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent";

            HttpClient client = HttpClient.newHttpClient();
            HttpRequest httpRequest = HttpRequest.newBuilder()
                .uri(URI.create(apiUrl + "?key=" + geminiApiKey))
                .header("Content-Type", "application/json")
                .POST(HttpRequest.BodyPublishers.ofString(requestBody))
                .build();

            HttpResponse<String> response = client.send(httpRequest, HttpResponse.BodyHandlers.ofString());

            if (response.statusCode() >= 200 && response.statusCode() < 300) {
                var root = objectMapper.readTree(response.body());
                var candidates = root.path("candidates");
                if (candidates.isArray() && candidates.size() > 0) {
                    return candidates.get(0).path("content").path("parts").get(0).path("text").asText(
                        "The correct answer is " + correct + ". Please review the course material for more details."
                    );
                }
            }
        } catch (Exception e) {
            // Fallback explanation
        }
        
        return String.format("The correct answer is '%s'. Your answer '%s' was incorrect. Please review the related concepts in your course materials.", correct, selected);
    }
}
