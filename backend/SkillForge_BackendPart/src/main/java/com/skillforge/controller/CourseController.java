package com.skillforge.controller;

import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.skillforge.dto.CourseDTO;
import com.skillforge.entity.User;
import com.skillforge.repository.UserRepository;
import com.skillforge.service.CourseService;
import com.skillforge.service.EnrollmentService;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/courses")
@CrossOrigin(origins = "http://localhost:3000")
public class CourseController {

    @Autowired
    private CourseService courseService;

    @Autowired
    private EnrollmentService enrollmentService;

    @Autowired
    private UserRepository userRepository;

    @GetMapping
    public ResponseEntity<List<CourseDTO>> getAllCourses() {
        List<CourseDTO> courses = courseService.getAllCourses();
        return ResponseEntity.ok(courses);
    }

    // Public endpoint for dropdowns: returns [{id,title}], can optionally filter by instructorId
    @GetMapping("/titles")
    public ResponseEntity<List<Map<String, Object>>> getCourseTitles(@RequestParam(required = false) Long instructorId) {
        List<CourseDTO> source = (instructorId != null)
                ? courseService.getCoursesByInstructor(instructorId)
                : courseService.getAllCourses();
        List<Map<String, Object>> titles = source.stream()
                .map(c -> {
                    Map<String, Object> m = new java.util.HashMap<>();
                    m.put("id", c.getId());
                    m.put("title", c.getTitle());
                    return m;
                })
                .collect(Collectors.toList());
        return ResponseEntity.ok(titles);
    }

    @GetMapping("/instructor")
    public ResponseEntity<?> getCoursesForInstructor(@RequestParam(required = false) Long instructorId) {
        Long actualInstructorId = instructorId;
        if (actualInstructorId == null) {
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            String email = authentication.getName();
            Optional<User> user = userRepository.findByEmail(email);
            if (user.isEmpty() || user.get().getRole() != User.Role.INSTRUCTOR) {
                return ResponseEntity.badRequest().body("User is not an instructor or not found");
            }
            actualInstructorId = user.get().getId();
        }
        List<CourseDTO> courses = courseService.getCoursesByInstructor(actualInstructorId);
        return ResponseEntity.ok(courses);
    }

    @GetMapping("/instructor/titles")
    public ResponseEntity<List<Map<String, Object>>> getCourseTitlesForInstructor(@RequestParam(required = false) Long instructorId) {
        Long actualInstructorId = instructorId;
        if (actualInstructorId == null) {
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            String email = authentication.getName();
            Optional<User> user = userRepository.findByEmail(email);
            if (user.isEmpty() || user.get().getRole() != User.Role.INSTRUCTOR) {
                return ResponseEntity.badRequest().build();
            }
            actualInstructorId = user.get().getId();
        }
        List<Map<String, Object>> titles = courseService.getCoursesByInstructor(actualInstructorId)
                .stream()
                .map(c -> {
                    Map<String, Object> m = new java.util.HashMap<>();
                    m.put("id", c.getId());
                    m.put("title", c.getTitle());
                    return m;
                })
                .collect(Collectors.toList());
        return ResponseEntity.ok(titles);
    }

    @PostMapping("/{id}/enroll")
    public ResponseEntity<?> toggleEnroll(@PathVariable("id") Long courseId, @RequestParam Long studentId) {
        var e = enrollmentService.toggle(courseId, studentId);
        boolean enrolled = e.getUnenrolledAt() == null;
        return ResponseEntity.ok(java.util.Map.of("status", enrolled ? "enrolled" : "unenrolled", "enrollment", e));
    }

    @GetMapping("/{id}/enrollment-status")
    public ResponseEntity<?> enrollmentStatus(@PathVariable("id") Long courseId, @RequestParam Long studentId) {
        boolean enrolled = enrollmentService.isEnrolled(courseId, studentId);
        return ResponseEntity.ok(java.util.Map.of("enrolled", enrolled));
    }

    @GetMapping("/student")
    public ResponseEntity<List<CourseDTO>> getCoursesForStudent() {
        List<CourseDTO> courses = courseService.getAllCourses();
        return ResponseEntity.ok(courses);
    }

    @PostMapping
    public ResponseEntity<?> createCourse(@Valid @RequestBody CourseDTO courseDTO) {
        try {
            CourseDTO createdCourse = courseService.createCourse(courseDTO);
            return ResponseEntity.ok(createdCourse);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Error: " + e.getMessage());
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updateCourse(@PathVariable Long id, @Valid @RequestBody CourseDTO courseDTO) {
        try {
            CourseDTO updatedCourse = courseService.updateCourse(id, courseDTO);
            return ResponseEntity.ok(updatedCourse);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Error: " + e.getMessage());
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteCourse(@PathVariable Long id) {
        try {
            courseService.deleteCourse(id);
            return ResponseEntity.ok("Course deleted successfully");
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Error: " + e.getMessage());
        }
    }
}
