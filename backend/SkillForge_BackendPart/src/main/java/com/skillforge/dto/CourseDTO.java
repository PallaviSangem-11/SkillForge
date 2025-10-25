package com.skillforge.dto;

import com.skillforge.entity.Course;
import com.skillforge.entity.User;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public class CourseDTO {
    
    private Long id;
    
    @NotBlank(message = "Title is required")
    @Size(max = 100, message = "Title must not exceed 100 characters")
    private String title;
    
    @NotBlank(message = "Description is required")
    @Size(max = 1000, message = "Description must not exceed 1000 characters")
    private String description;
    
    @NotNull(message = "Difficulty level is required")
    private Course.DifficultyLevel difficultyLevel;
    
    private Integer estimatedDuration;
    
    private String prerequisites;
    
    private Long instructorId;
    
    private String instructorName;
    
    // Constructors
    public CourseDTO() {}
    
    public CourseDTO(String title, String description, Course.DifficultyLevel difficultyLevel, 
                     Integer estimatedDuration, String prerequisites, Long instructorId) {
        this.title = title;
        this.description = description;
        this.difficultyLevel = difficultyLevel;
        this.estimatedDuration = estimatedDuration;
        this.prerequisites = prerequisites;
        this.instructorId = instructorId;
    }
    
    // Getters and Setters
    public Long getId() {
        return id;
    }
    
    public void setId(Long id) {
        this.id = id;
    }
    
    public String getTitle() {
        return title;
    }
    
    public void setTitle(String title) {
        this.title = title;
    }
    
    public String getDescription() {
        return description;
    }
    
    public void setDescription(String description) {
        this.description = description;
    }
    
    public Course.DifficultyLevel getDifficultyLevel() {
        return difficultyLevel;
    }
    
    public void setDifficultyLevel(Course.DifficultyLevel difficultyLevel) {
        this.difficultyLevel = difficultyLevel;
    }
    
    public Integer getEstimatedDuration() {
        return estimatedDuration;
    }
    
    public void setEstimatedDuration(Integer estimatedDuration) {
        this.estimatedDuration = estimatedDuration;
    }
    
    public String getPrerequisites() {
        return prerequisites;
    }
    
    public void setPrerequisites(String prerequisites) {
        this.prerequisites = prerequisites;
    }
    
    public Long getInstructorId() {
        return instructorId;
    }
    
    public void setInstructorId(Long instructorId) {
        this.instructorId = instructorId;
    }
    
    public String getInstructorName() {
        return instructorName;
    }
    
    public void setInstructorName(String instructorName) {
        this.instructorName = instructorName;
    }
}
