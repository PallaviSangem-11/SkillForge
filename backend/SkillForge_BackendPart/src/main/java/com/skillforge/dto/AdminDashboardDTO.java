package com.skillforge.dto;

import java.util.List;
import java.util.Map;

public class AdminDashboardDTO {
    private Integer totalStudents;
    private Integer totalInstructors;
    private Integer totalCourses;
    private Map<String, Object> platformStats;

    public AdminDashboardDTO() {}

    public Integer getTotalStudents() {
        return totalStudents;
    }

    public void setTotalStudents(Integer totalStudents) {
        this.totalStudents = totalStudents;
    }

    public Integer getTotalInstructors() {
        return totalInstructors;
    }

    public void setTotalInstructors(Integer totalInstructors) {
        this.totalInstructors = totalInstructors;
    }

    public Integer getTotalCourses() {
        return totalCourses;
    }

    public void setTotalCourses(Integer totalCourses) {
        this.totalCourses = totalCourses;
    }

    public Map<String, Object> getPlatformStats() {
        return platformStats;
    }

    public void setPlatformStats(Map<String, Object> platformStats) {
        this.platformStats = platformStats;
    }
}

