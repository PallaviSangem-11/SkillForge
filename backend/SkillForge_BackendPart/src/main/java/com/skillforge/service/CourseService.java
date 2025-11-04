package com.skillforge.service;

import com.skillforge.dto.CourseDTO;
import com.skillforge.entity.Course;
import com.skillforge.entity.User;
import com.skillforge.repository.CourseRepository;
import com.skillforge.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.core.type.TypeReference;
import java.util.ArrayList;

@Service
public class CourseService {
    
    @Autowired
    private CourseRepository courseRepository;
    
    @Autowired
    private UserRepository userRepository;

    private final ObjectMapper objectMapper = new ObjectMapper();
    
    public List<CourseDTO> getAllCourses() {
        List<Course> courses = courseRepository.findAll();
        return courses.stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }
    
    public List<CourseDTO> getCoursesByInstructor(Long instructorId) {
        List<Course> courses = courseRepository.findByInstructorId(instructorId);
        return courses.stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }
    
    public CourseDTO createCourse(CourseDTO courseDTO) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String email = authentication.getName();
        
        User instructor = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Instructor not found"));
        
        Course course = new Course();
        course.setTitle(courseDTO.getTitle());
        course.setDescription(courseDTO.getDescription());
        course.setDifficultyLevel(courseDTO.getDifficultyLevel());
        course.setEstimatedDuration(courseDTO.getEstimatedDuration());
        course.setPrerequisites(courseDTO.getPrerequisites());
        // set materials as JSON string
        try {
            if (courseDTO.getMaterials() != null) {
                course.setMaterials(objectMapper.writeValueAsString(courseDTO.getMaterials()));
            }
        } catch (Exception e) {
            // ignore serialization issues; store null
            course.setMaterials(null);
        }
        course.setInstructor(instructor);
        
        Course savedCourse = courseRepository.save(course);
        return convertToDTO(savedCourse);
    }
    
    public CourseDTO updateCourse(Long id, CourseDTO courseDTO) {
        Optional<Course> courseOpt = courseRepository.findById(id);
        if (courseOpt.isEmpty()) {
            throw new RuntimeException("Course not found");
        }
        
        Course course = courseOpt.get();
        
        // Check if the current user is the instructor of this course
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String email = authentication.getName();
        User currentUser = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));
        
        if (!course.getInstructor().getId().equals(currentUser.getId())) {
            throw new RuntimeException("You can only update your own courses");
        }
        
        course.setTitle(courseDTO.getTitle());
        course.setDescription(courseDTO.getDescription());
        course.setDifficultyLevel(courseDTO.getDifficultyLevel());
        course.setEstimatedDuration(courseDTO.getEstimatedDuration());
        course.setPrerequisites(courseDTO.getPrerequisites());
        try {
            if (courseDTO.getMaterials() != null) {
                course.setMaterials(objectMapper.writeValueAsString(courseDTO.getMaterials()));
            } else {
                course.setMaterials(null);
            }
        } catch (Exception e) {
            // ignore
        }
        
        Course updatedCourse = courseRepository.save(course);
        return convertToDTO(updatedCourse);
    }
    
    public void deleteCourse(Long id) {
        Optional<Course> courseOpt = courseRepository.findById(id);
        if (courseOpt.isEmpty()) {
            throw new RuntimeException("Course not found");
        }
        
        Course course = courseOpt.get();
        
        // Check if the current user is the instructor of this course
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String email = authentication.getName();
        User currentUser = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));
        
        if (!course.getInstructor().getId().equals(currentUser.getId())) {
            throw new RuntimeException("You can only delete your own courses");
        }
        
        courseRepository.delete(course);
    }
    
    public CourseDTO convertToDTO(Course course) {
        CourseDTO dto = new CourseDTO();
        dto.setId(course.getId());
        dto.setTitle(course.getTitle());
        dto.setDescription(course.getDescription());
        dto.setDifficultyLevel(course.getDifficultyLevel());
        dto.setEstimatedDuration(course.getEstimatedDuration());
        dto.setPrerequisites(course.getPrerequisites());
        // parse materials JSON to List<String>
        try {
            if (course.getMaterials() != null && !course.getMaterials().isEmpty()) {
                List<String> materials = objectMapper.readValue(course.getMaterials(), new TypeReference<List<String>>(){});
                dto.setMaterials(materials);
            } else {
                dto.setMaterials(new ArrayList<>());
            }
        } catch (Exception e) {
            dto.setMaterials(new ArrayList<>());
        }
        
        // Safely get instructor info without circular reference
        if (course.getInstructor() != null) {
            dto.setInstructorId(course.getInstructor().getId());
            dto.setInstructorName(course.getInstructor().getFirstName() + " " + course.getInstructor().getLastName());
        }
        
        return dto;
    }
}
