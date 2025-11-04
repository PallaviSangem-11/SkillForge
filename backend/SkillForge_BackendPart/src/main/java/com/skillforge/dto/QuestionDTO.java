package com.skillforge.dto;

import java.util.List;

public class QuestionDTO {
    private String prompt;
    private String type; // "MCQ", "SHORT_ANSWER", etc.
    private List<String> options; // For MCQ
    private String correctAnswer;

    public QuestionDTO() {}

    public String getPrompt() {
        return prompt;
    }

    public void setPrompt(String prompt) {
        this.prompt = prompt;
    }

    public String getType() {
        return type;
    }

    public void setType(String type) {
        this.type = type;
    }

    public List<String> getOptions() {
        return options;
    }

    public void setOptions(List<String> options) {
        this.options = options;
    }

    public String getCorrectAnswer() {
        return correctAnswer;
    }

    public void setCorrectAnswer(String correctAnswer) {
        this.correctAnswer = correctAnswer;
    }
}

