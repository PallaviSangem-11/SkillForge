package com.skillforge.dto;

import java.util.List;

public class WrongAnswerDTO {
    private Long questionId;
    private String prompt;
    private String selectedAnswer;
    private String correctAnswer;
    private List<String> options;

    public WrongAnswerDTO() {}

    public WrongAnswerDTO(Long questionId, String prompt, String selectedAnswer, String correctAnswer, List<String> options) {
        this.questionId = questionId;
        this.prompt = prompt;
        this.selectedAnswer = selectedAnswer;
        this.correctAnswer = correctAnswer;
        this.options = options;
    }

    public Long getQuestionId() {
        return questionId;
    }

    public void setQuestionId(Long questionId) {
        this.questionId = questionId;
    }

    public String getPrompt() {
        return prompt;
    }

    public void setPrompt(String prompt) {
        this.prompt = prompt;
    }

    public String getSelectedAnswer() {
        return selectedAnswer;
    }

    public void setSelectedAnswer(String selectedAnswer) {
        this.selectedAnswer = selectedAnswer;
    }

    public String getCorrectAnswer() {
        return correctAnswer;
    }

    public void setCorrectAnswer(String correctAnswer) {
        this.correctAnswer = correctAnswer;
    }

    public List<String> getOptions() {
        return options;
    }

    public void setOptions(List<String> options) {
        this.options = options;
    }
}
