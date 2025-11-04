package com.skillforge.dto;

import java.time.LocalDateTime;

public class RecentActivityDTO {
    private String activityType; // "QUIZ_ATTEMPT", "COURSE_ENROLLMENT", etc.
    private String title;
    private LocalDateTime timestamp;
    private Double score;
    private Long courseId;
    private Long quizId;

    public RecentActivityDTO() {}

    public String getActivityType() {
        return activityType;
    }

    public void setActivityType(String activityType) {
        this.activityType = activityType;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public LocalDateTime getTimestamp() {
        return timestamp;
    }

    public void setTimestamp(LocalDateTime timestamp) {
        this.timestamp = timestamp;
    }

    public Double getScore() {
        return score;
    }

    public void setScore(Double score) {
        this.score = score;
    }

    public Long getCourseId() {
        return courseId;
    }

    public void setCourseId(Long courseId) {
        this.courseId = courseId;
    }

    public Long getQuizId() {
        return quizId;
    }

    public void setQuizId(Long quizId) {
        this.quizId = quizId;
    }
}

