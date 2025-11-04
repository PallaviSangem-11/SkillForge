package com.skillforge.controller;

import com.skillforge.dto.*;
import com.skillforge.entity.User;
import com.skillforge.repository.UserRepository;
import com.skillforge.service.DashboardService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.Optional;

@RestController
@RequestMapping("/api/dashboard")
@CrossOrigin(origins = "http://localhost:3000")
public class DashboardController {

    @Autowired
    private DashboardService dashboardService;

    @Autowired
    private UserRepository userRepository;

    @GetMapping("/student")
    public ResponseEntity<?> getStudentDashboard(@RequestParam(required = false) Long studentId) {
        try {
            Long actualStudentId = studentId;
            if (actualStudentId == null) {
                // Get from authentication
                Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
                String email = authentication.getName();
                Optional<User> user = userRepository.findByEmail(email);
                if (user.isPresent() && user.get().getRole() == User.Role.STUDENT) {
                    actualStudentId = user.get().getId();
                } else {
                    return ResponseEntity.badRequest().body("User is not a student or not found");
                }
            }
            StudentDashboardDTO dashboard = dashboardService.getStudentDashboard(actualStudentId);
            return ResponseEntity.ok(dashboard);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Error: " + e.getMessage());
        }
    }

    @GetMapping("/instructor")
    public ResponseEntity<?> getInstructorDashboard(@RequestParam(required = false) Long instructorId) {
        try {
            Long actualInstructorId = instructorId;
            if (actualInstructorId == null) {
                Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
                String email = authentication.getName();
                Optional<User> user = userRepository.findByEmail(email);
                if (user.isPresent() && user.get().getRole() == User.Role.INSTRUCTOR) {
                    actualInstructorId = user.get().getId();
                } else {
                    return ResponseEntity.badRequest().body("User is not an instructor or not found");
                }
            }
            InstructorDashboardDTO dashboard = dashboardService.getInstructorDashboard(actualInstructorId);
            return ResponseEntity.ok(dashboard);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Error: " + e.getMessage());
        }
    }

    @GetMapping("/admin")
    public ResponseEntity<?> getAdminDashboard() {
        try {
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            String email = authentication.getName();
            Optional<User> user = userRepository.findByEmail(email);
            if (user.isPresent() && user.get().getRole() == User.Role.ADMIN) {
                AdminDashboardDTO dashboard = dashboardService.getAdminDashboard();
                return ResponseEntity.ok(dashboard);
            } else {
                return ResponseEntity.badRequest().body("User is not an admin or not found");
            }
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Error: " + e.getMessage());
        }
    }
}

