package com.skillforge.dto;

import java.util.List;

public class QuizScoreResponse {
    private Long attemptId;
    private Double score;
    private Integer totalQuestions;
    private Integer correctAnswers;
    private String feedback;
    private String aiFeedback;
    private Long nextQuizId;
    private String nextQuizTitle;
    private List<WrongAnswerDTO> wrongAnswers;

    public QuizScoreResponse() {}

    public Long getAttemptId() {
        return attemptId;
    }

    public void setAttemptId(Long attemptId) {
        this.attemptId = attemptId;
    }

    public Double getScore() {
        return score;
    }

    public void setScore(Double score) {
        this.score = score;
    }

    public Integer getTotalQuestions() {
        return totalQuestions;
    }

    public void setTotalQuestions(Integer totalQuestions) {
        this.totalQuestions = totalQuestions;
    }

    public Integer getCorrectAnswers() {
        return correctAnswers;
    }

    public void setCorrectAnswers(Integer correctAnswers) {
        this.correctAnswers = correctAnswers;
    }

    public String getFeedback() {
        return feedback;
    }

    public void setFeedback(String feedback) {
        this.feedback = feedback;
    }

    public String getAiFeedback() {
        return aiFeedback;
    }

    public void setAiFeedback(String aiFeedback) {
        this.aiFeedback = aiFeedback;
    }

    public Long getNextQuizId() {
        return nextQuizId;
    }

    public void setNextQuizId(Long nextQuizId) {
        this.nextQuizId = nextQuizId;
    }

    public String getNextQuizTitle() {
        return nextQuizTitle;
    }

    public void setNextQuizTitle(String nextQuizTitle) {
        this.nextQuizTitle = nextQuizTitle;
    }

    public List<WrongAnswerDTO> getWrongAnswers() {
        return wrongAnswers;
    }

    public void setWrongAnswers(List<WrongAnswerDTO> wrongAnswers) {
        this.wrongAnswers = wrongAnswers;
    }
}

