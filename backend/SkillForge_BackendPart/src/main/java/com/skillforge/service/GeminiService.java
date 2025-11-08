package com.skillforge.service;

import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;

import java.util.Map;

@Service
public class GeminiService {

    private final RestTemplate restTemplate = new RestTemplate();
    private final ObjectMapper mapper = new ObjectMapper();

    public String generateQuizJSON(String topic, int count, String apiKey) throws Exception {
        // ✅ Correct endpoint with API key as query parameter
        String url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=" + apiKey;

        // ✅ Gemini prompt - explicitly request raw JSON without markdown
        String prompt = String.format(
                "Generate %d multiple choice questions about '%s'. " +
                "Return ONLY valid JSON (no markdown, no code blocks, no explanations). " +
                "The JSON must have this exact structure: {\"questions\":[{\"prompt\":\"Question text?\",\"options\":[\"Option 1\",\"Option 2\",\"Option 3\",\"Option 4\"],\"correct\":0}]} " +
                "where 'prompt' is the question text, 'options' is an array of 4 options, and 'correct' is the 0-based index of the correct answer. " +
                "Return ONLY the JSON object, nothing else.",
                count, topic
        );

        // ✅ Request body for Gemini
        String requestBody = String.format(
                "{\"contents\":[{\"parts\":[{\"text\":\"%s\"}]}]}",
                prompt.replace("\"", "\\\"") // escape quotes safely
        );

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);

        HttpEntity<String> entity = new HttpEntity<>(requestBody, headers);

        // ✅ Make POST request
        ResponseEntity<String> response = restTemplate.exchange(url, HttpMethod.POST, entity, String.class);

        if (response.getStatusCode() == HttpStatus.OK) {
            return extractJsonFromGeminiResponse(response.getBody());
        } else {
            throw new RuntimeException("Gemini API error: " + response.getStatusCode());
        }
    }

    // ✅ Extract the text content (the JSON Gemini generated)
    private String extractJsonFromGeminiResponse(String responseBody) throws Exception {
        JsonNode root = mapper.readTree(responseBody);
        JsonNode candidates = root.path("candidates");
        
        if (candidates.isEmpty() || !candidates.isArray()) {
            throw new RuntimeException("Gemini API returned no candidates. Response: " + responseBody);
        }
        
        JsonNode textNode = candidates.get(0)
                .path("content").path("parts").get(0).path("text");

        if (textNode.isMissingNode() || textNode.isNull()) {
            throw new RuntimeException("Gemini API returned invalid response (missing text). Response: " + responseBody);
        }

        String rawText = textNode.asText();
        
        // Clean the JSON by removing markdown code blocks if present
        return cleanJsonFromMarkdown(rawText);
    }
    
    // ✅ Clean JSON string from markdown code blocks (e.g., ```json ... ```)
    private String cleanJsonFromMarkdown(String text) {
        if (text == null || text.isEmpty()) {
            return text;
        }
        
        String cleaned = text.trim();
        
        // Remove markdown code blocks (```json ... ``` or ``` ... ```)
        if (cleaned.startsWith("```")) {
            // Find the first newline after ```
            int startIdx = cleaned.indexOf('\n');
            if (startIdx > 0) {
                cleaned = cleaned.substring(startIdx + 1);
            } else {
                // No newline, try to find the closing ```
                cleaned = cleaned.replaceFirst("^```[a-zA-Z]*", "");
            }
            
            // Remove closing ```
            if (cleaned.endsWith("```")) {
                cleaned = cleaned.substring(0, cleaned.length() - 3);
            }
            cleaned = cleaned.trim();
        }
        
        // Remove any leading/trailing whitespace
        cleaned = cleaned.trim();
        
        // If it still doesn't start with { or [, it might have other prefixes
        if (!cleaned.startsWith("{") && !cleaned.startsWith("[")) {
            // Try to find the first { or [
            int jsonStart = cleaned.indexOf('{');
            if (jsonStart == -1) {
                jsonStart = cleaned.indexOf('[');
            }
            if (jsonStart > 0) {
                cleaned = cleaned.substring(jsonStart);
            }
        }
        
        return cleaned;
    }

    // ✅ General-purpose text generation for explanations
    public String generateText(String prompt, String apiKey) throws Exception {
        String url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=" + apiKey;

        String requestBody = String.format(
                "{\"contents\":[{\"parts\":[{\"text\":\"%s\"}]}]}",
                prompt.replace("\"", "\\\"")
        );

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        HttpEntity<String> entity = new HttpEntity<>(requestBody, headers);

        ResponseEntity<String> response = restTemplate.exchange(url, HttpMethod.POST, entity, String.class);
        if (response.getStatusCode() != HttpStatus.OK) {
            throw new RuntimeException("Gemini API error: " + response.getStatusCode());
        }

        JsonNode root = mapper.readTree(response.getBody());
        JsonNode candidates = root.path("candidates");
        if (candidates.isEmpty() || !candidates.isArray()) {
            throw new RuntimeException("Gemini API returned no candidates");
        }
        JsonNode textNode = candidates.get(0).path("content").path("parts").get(0).path("text");
        return textNode.isMissingNode() ? "" : textNode.asText();
    }
}
