package com.skillforge.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
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
    private static final Logger logger = LoggerFactory.getLogger(AIController.class);

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

    /**
     * Lightweight local fallback that analyzes feedback text heuristically and
     * returns a structured summary when the external AI service is unavailable.
     */
    private Map<String, Object> generateLocalSummary(String feedback) {
        if (feedback == null || feedback.trim().isEmpty()) {
            Map<String, Object> empty = new java.util.HashMap<>();
            empty.put("themes", List.of());
            empty.put("strengths", List.of());
            empty.put("improvements", List.of());
            empty.put("priority", "Low");
            empty.put("summary", "No feedback available to summarize.");
            return empty;
        }

        String text = feedback.toLowerCase();
        java.util.List<String> themes = new java.util.ArrayList<>();
        java.util.List<String> strengths = new java.util.ArrayList<>();
        java.util.List<String> improvements = new java.util.ArrayList<>();

        if (text.contains("difficult") || text.contains("hard") || text.contains("confusing")) {
            themes.add("Difficulty / clarity");
            improvements.add("Clarify difficult sections and add more examples or explanations.");
        }
        if (text.contains("clear") || text.contains("easy to understand") || text.contains("well explained")) {
            strengths.add("Clear explanations");
        }
        if (text.contains("practice") || text.contains("exercise") || text.contains("questions")) {
            themes.add("More practice desired");
            improvements.add("Add more practice exercises and formative quizzes.");
        }
        if (text.contains("time") || text.contains("duration") || text.contains("too long")) {
            themes.add("Time management / pacing");
            improvements.add("Review pacing and expected time commitments for course modules.");
        }

        if (themes.isEmpty()) {
            themes.add("General feedback");
        }
        if (strengths.isEmpty()) {
            strengths.add("Keep up the good work");
        }
        if (improvements.isEmpty()) {
            improvements.add("Continue monitoring student feedback and refine content as needed.");
        }

        String priority = themes.size() > 2 ? "High" : themes.size() > 0 ? "Medium" : "Low";

        Map<String, Object> result = new java.util.HashMap<>();
        result.put("themes", themes);
        result.put("strengths", strengths);
        result.put("improvements", improvements);
        result.put("priority", priority);
        // Compose a short summary sentence
        result.put("summary", String.format("Detected %d theme(s). Top theme: %s.", themes.size(), themes.get(0)));
        return result;
    }

    private Map<String, Object> generateQuizWithGemini(String topic, Integer questionCount, String difficulty, String courseContext, String prompt) throws Exception {
        String apiUrl = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=";

        // Use the provided prompt or create a default one
        String aiPrompt = prompt != null ? prompt : String.format(
                "Generate %d multiple choice quiz questions EXCLUSIVELY about '%s' for %s level students. "
                + "CRITICAL REQUIREMENTS: "
                + "- Every question must be SPECIFICALLY about '%s' - not general concepts "
                + "- Test practical understanding and real-world application of '%s' "
                + "- Each question has exactly 4 options with only one correct answer "
                + "- Questions should be challenging but appropriate for %s level "
                + "- Focus on the most important aspects of '%s' "
                + "RESPONSE FORMAT - Return ONLY valid JSON array: "
                + "[{\"prompt\":\"Question about %s?\",\"options\":[\"Option 1\",\"Option 2\",\"Option 3\",\"Option 4\"],\"correctAnswer\":\"Option 1\",\"type\":\"MCQ\"}] "
                + "Generate %d questions specifically about '%s' now. Return only the JSON array:",
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

        int status = response.statusCode();
        String body = response.body();
        if (status >= 200 && status < 300) {
            try {
                var root = objectMapper.readTree(body);
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

                // Fallback: if the response doesn't have candidates in expected format, return raw body
                logger.warn("Unexpected Gemini response structure for quiz generation: {}", body);
                return Map.of("generatedText", body, "success", false);
            } catch (Exception ex) {
                logger.error("Failed to parse Gemini quiz response", ex);
                return Map.of("generatedText", body, "success", false);
            }
        }

        logger.error("Gemini quiz generation failed: status={} body={}", status, body);
        throw new Exception("Failed to generate quiz with Gemini API. Status: " + status + " Body: " + body);
    }

    @PostMapping("/generate-feedback-summary")
    public ResponseEntity<?> generateFeedbackSummary(@RequestBody Map<String, Object> request) {
        try {
            String feedback = (String) request.get("feedback");
            String prompt = (String) request.get("prompt");

            if (feedback == null || feedback.trim().isEmpty()) {
                return ResponseEntity.badRequest().body("Feedback is required");
            }

            if (geminiApiKey == null || geminiApiKey.isEmpty()) {
                return ResponseEntity.badRequest().body("Gemini API key not configured");
            }

            String aiPrompt = prompt != null ? prompt : String.format(
                    "Analyze the following student feedback for a course and provide a structured summary:\n\n"
                    + "Feedback:\n%s\n\n"
                    + "Provide a JSON response with these fields:\n"
                    + "{\n"
                    + "  \"themes\": [\"theme1\", \"theme2\"],\n"
                    + "  \"strengths\": [\"strength1\", \"strength2\"],\n"
                    + "  \"improvements\": [\"improvement1\", \"improvement2\"],\n"
                    + "  \"priority\": \"High/Medium/Low\",\n"
                    + "  \"summary\": \"Brief overall summary\"\n"
                    + "}\n\n"
                    + "Return ONLY valid JSON, no markdown, no code blocks.",
                    feedback
            );

            Map<String, Object> payload = Map.of(
                    "contents", List.of(Map.of(
                            "parts", List.of(Map.of("text", aiPrompt))
                    )),
                    "generationConfig", Map.of(
                            "temperature", 0.5,
                            "topK", 40,
                            "topP", 0.95,
                            "maxOutputTokens", 1500
                    )
            );

            String requestBody = objectMapper.writeValueAsString(payload);
            String apiUrl = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key="+ geminiApiKey;

            HttpClient client = HttpClient.newHttpClient();
            HttpRequest httpRequest = HttpRequest.newBuilder()
                    .uri(URI.create(apiUrl))
                    .header("Content-Type", "application/json")
                    .POST(HttpRequest.BodyPublishers.ofString(requestBody))
                    .build();

            HttpResponse<String> response = client.send(httpRequest, HttpResponse.BodyHandlers.ofString());
            int status = response.statusCode();
            String body = response.body();

            if (status >= 200 && status < 300) {
                try {
                    var root = objectMapper.readTree(body);
                    var candidates = root.path("candidates");
                    if (candidates.isArray() && candidates.size() > 0) {
                        String generatedText = candidates.get(0).path("content").path("parts").get(0).path("text").asText("");

                        // Try to parse as JSON
                        try {
                            // Clean markdown if present
                            String cleaned = generatedText.trim();
                            if (cleaned.startsWith("```")) {
                                int startIdx = cleaned.indexOf('\n');
                                if (startIdx > 0) {
                                    cleaned = cleaned.substring(startIdx + 1);
                                }
                                if (cleaned.endsWith("```")) {
                                    cleaned = cleaned.substring(0, cleaned.length() - 3);
                                }
                            }
                            cleaned = cleaned.trim();

                            // Find JSON start
                            int jsonStart = cleaned.indexOf('{');
                            if (jsonStart > 0) {
                                cleaned = cleaned.substring(jsonStart);
                            }

                            var summary = objectMapper.readValue(cleaned, Map.class);
                            // Return both structured summary and raw generated text for frontend fallback/diagnostics
                            return ResponseEntity.ok(Map.of(
                                    "summary", summary,
                                    "raw", generatedText
                            ));
                        } catch (Exception e) {
                            logger.warn("Could not parse AI-generated JSON; returning text summary. Generated text: {}", generatedText);
                            // If not JSON, return as text summary
                            Map<String, Object> fallback = new java.util.HashMap<>();
                            fallback.put("summary", generatedText);
                            fallback.put("themes", List.of("Feedback analysis"));
                            fallback.put("strengths", List.of());
                            fallback.put("improvements", List.of());
                            fallback.put("priority", "Medium");
                            return ResponseEntity.ok(Map.of("summary", fallback, "raw", generatedText));
                        }
                    }
                    // Fallback: unexpected structure — return body as raw and provide minimal structured object
                    logger.warn("Unexpected Gemini response structure for feedback summary: {}", body);
                    Map<String, Object> fallback = new java.util.HashMap<>();
                    fallback.put("summary", body);
                    fallback.put("themes", List.of());
                    fallback.put("strengths", List.of());
                    fallback.put("improvements", List.of());
                    fallback.put("priority", "Medium");
                    return ResponseEntity.ok(Map.of("summary", fallback, "raw", body));
                } catch (Exception ex) {
                    logger.error("Failed to parse Gemini response for feedback summary", ex);
                    return ResponseEntity.badRequest().body("Failed to parse Gemini response: " + ex.getMessage());
                }
            }

            // Non-2xx status: log and return a server-side fallback summary so the frontend can still show useful info.
            logger.error("Gemini feedback summary request failed: status={} body={}", status, body);
            // Build a lightweight local summary as a fallback instead of returning a hard error to the client.
            Map<String, Object> localFallback = generateLocalSummary(feedback);
            // Include the external API body for diagnostics in 'raw'
            return ResponseEntity.ok(Map.of("summary", localFallback, "raw", body));
        } catch (Exception e) {
            logger.error("Error in generateFeedbackSummary", e);
            return ResponseEntity.badRequest().body("Error: " + e.getMessage());
        }
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
                    "You are an educational AI tutor. A student answered a quiz question incorrectly. "
                    + "Provide a clear, helpful explanation of why their answer was wrong and why the correct answer is right. "
                    + "Be encouraging and educational.\n\n"
                    + "Question: %s\n"
                    + "Student's Answer: %s\n"
                    + "Correct Answer: %s\n"
                    + "Course: %s\n"
                    + "Topic: %s\n\n"
                    + "Provide a concise but thorough explanation (2-3 sentences):",
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
