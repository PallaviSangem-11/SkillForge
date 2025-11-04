package com.skillforge.dto;

import java.util.List;
import java.util.Map;

public class StudentDashboardDTO {
    private List<CourseDTO> recommendedCourses;
    private List<CourseDTO> enrolledCourses;
    private List<RecentActivityDTO> recentActivities;
    private Double overallScore;
    private Map<String, Object> progressData; // For graphs/charts
    private Integer totalQuizzesAttempted;
    private Integer totalCoursesEnrolled;

    public StudentDashboardDTO() {}

    public List<CourseDTO> getRecommendedCourses() {
        return recommendedCourses;
    }

    public void setRecommendedCourses(List<CourseDTO> recommendedCourses) {
        this.recommendedCourses = recommendedCourses;
    }

    public List<CourseDTO> getEnrolledCourses() {
        return enrolledCourses;
    }

    public void setEnrolledCourses(List<CourseDTO> enrolledCourses) {
        this.enrolledCourses = enrolledCourses;
    }

    public List<RecentActivityDTO> getRecentActivities() {
        return recentActivities;
    }

    public void setRecentActivities(List<RecentActivityDTO> recentActivities) {
        this.recentActivities = recentActivities;
    }

    public Double getOverallScore() {
        return overallScore;
    }

    public void setOverallScore(Double overallScore) {
        this.overallScore = overallScore;
    }

    public Map<String, Object> getProgressData() {
        return progressData;
    }

    public void setProgressData(Map<String, Object> progressData) {
        this.progressData = progressData;
    }

    public Integer getTotalQuizzesAttempted() {
        return totalQuizzesAttempted;
    }

    public void setTotalQuizzesAttempted(Integer totalQuizzesAttempted) {
        this.totalQuizzesAttempted = totalQuizzesAttempted;
    }

    public Integer getTotalCoursesEnrolled() {
        return totalCoursesEnrolled;
    }

    public void setTotalCoursesEnrolled(Integer totalCoursesEnrolled) {
        this.totalCoursesEnrolled = totalCoursesEnrolled;
    }
}

