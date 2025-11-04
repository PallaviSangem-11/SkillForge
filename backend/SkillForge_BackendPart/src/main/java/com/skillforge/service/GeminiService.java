package com.skillforge.service;

import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.http.*;

@Service
public class GeminiService {

    public String generateQuizJSON(String topic, int count, String apiKey) throws Exception {
        String prompt = String.format(
                "Generate %d multiple choice questions about '%s' in JSON format: "
                + "{\"questions\": [{\"prompt\": \"text\", \"options\": [\"A\",\"B\",\"C\",\"D\"], \"correct\": 0}]}", count, topic);

        String url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=" + apiKey;

        RestTemplate restTemplate = new RestTemplate();
        String payload = "{\"contents\": [{\"parts\": [{\"text\": \"" + prompt + "\"}]}]}";

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);

        HttpEntity<String> entity = new HttpEntity<>(payload, headers);
        ResponseEntity<String> response = restTemplate.postForEntity(url, entity, String.class);

        if (!response.getStatusCode().is2xxSuccessful()) {
            throw new RuntimeException("Gemini API error: " + response.getStatusCode());
        }

        return response.getBody();
    }
}


                 