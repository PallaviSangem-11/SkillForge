package com.skillforge.controller;

import com.skillforge.entity.CourseEnrollment;
import com.skillforge.service.EnrollmentService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/enrollments")
@CrossOrigin(origins = "http://localhost:3000")
public class EnrollmentController {

    @Autowired
    private EnrollmentService enrollmentService;

    @PostMapping("/enroll")
    public ResponseEntity<?> enroll(@RequestParam Long courseId, @RequestParam Long studentId) {
        try {
            CourseEnrollment e = enrollmentService.enroll(courseId, studentId);
            return ResponseEntity.ok(e);
        } catch (Exception ex) {
            return ResponseEntity.badRequest().body(ex.getMessage());
        }
    }

    @GetMapping("/student/{id}")
    public ResponseEntity<List<CourseEnrollment>> getForStudent(@PathVariable Long id) {
        return ResponseEntity.ok(enrollmentService.getEnrollmentsForStudent(id));
    }

    // Return all enrollments (used by frontend to compute enrollment counts)
    @GetMapping("")
    public ResponseEntity<List<CourseEnrollment>> getAll() {
        return ResponseEntity.ok(enrollmentService.getAllEnrollments());
    }

    @GetMapping("/course/{courseId}/count")
    public ResponseEntity<Long> getEnrollmentCount(@PathVariable Long courseId) {
        return ResponseEntity.ok(enrollmentService.getEnrollmentCount(courseId));
    }

    @PostMapping("/courses/{courseId}/enroll")
    public ResponseEntity<?> toggleEnroll(@PathVariable Long courseId, @RequestParam Long studentId) {
        try {
            CourseEnrollment e = enrollmentService.toggle(courseId, studentId);
            boolean enrolled = e.getUnenrolledAt() == null;
            Integer duration = e.getCourse() != null ? e.getCourse().getEstimatedDuration() : null;
            return ResponseEntity.ok(Map.of(
                    "status", enrolled ? "enrolled" : "unenrolled",
                    "enrollment", e,
                    "enrolledAt", e.getEnrolledAt(),
                    "durationHours", duration
            ));
        } catch (Exception ex) {
            return ResponseEntity.badRequest().body(ex.getMessage());
        }
    }

    @GetMapping("/courses/{courseId}/enrollment-status")
    public ResponseEntity<?> enrollmentStatus(@PathVariable Long courseId, @RequestParam Long studentId) {
        CourseEnrollment e = enrollmentService.getEnrollment(courseId, studentId);
        boolean enrolled = e != null && e.getUnenrolledAt() == null;
        Integer duration = null;
        if (e != null && e.getCourse() != null) {
            duration = e.getCourse().getEstimatedDuration();
        }
        return ResponseEntity.ok(Map.of(
                "enrolled", enrolled,
                "enrolledAt", e != null ? e.getEnrolledAt() : null,
                "durationHours", duration
        ));
    }
}
