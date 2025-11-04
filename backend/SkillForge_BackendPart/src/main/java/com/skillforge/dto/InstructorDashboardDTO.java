package com.skillforge.dto;

import java.util.List;

public class InstructorDashboardDTO {
    private Integer totalCoursesCreated;
    private Integer totalStudentsEnrolled;
    private List<RecentActivityDTO> recentActivities;
    private List<CourseStatsDTO> courseStats;

    public InstructorDashboardDTO() {}

    public Integer getTotalCoursesCreated() {
        return totalCoursesCreated;
    }

    public void setTotalCoursesCreated(Integer totalCoursesCreated) {
        this.totalCoursesCreated = totalCoursesCreated;
    }

    public Integer getTotalStudentsEnrolled() {
        return totalStudentsEnrolled;
    }

    public void setTotalStudentsEnrolled(Integer totalStudentsEnrolled) {
        this.totalStudentsEnrolled = totalStudentsEnrolled;
    }

    public List<RecentActivityDTO> getRecentActivities() {
        return recentActivities;
    }

    public void setRecentActivities(List<RecentActivityDTO> recentActivities) {
        this.recentActivities = recentActivities;
    }

    public List<CourseStatsDTO> getCourseStats() {
        return courseStats;
    }

    public void setCourseStats(List<CourseStatsDTO> courseStats) {
        this.courseStats = courseStats;
    }
}

