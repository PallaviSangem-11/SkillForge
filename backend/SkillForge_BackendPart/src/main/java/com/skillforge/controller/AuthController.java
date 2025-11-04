package com.skillforge.controller;

import com.skillforge.dto.AuthRequest;
import com.skillforge.dto.AuthResponse;
import com.skillforge.dto.RegisterRequest;
import com.skillforge.entity.User;
import com.skillforge.repository.UserRepository;
import com.skillforge.service.AuthService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = "http://localhost:3000")
public class AuthController {

    @Autowired
    private AuthService authService;

    @Autowired
    private UserRepository userRepository;

    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody RegisterRequest request) {
        try {
            System.out.println("Received registration request for email: " + request.getEmail());
            AuthResponse response = authService.register(request);
            System.out.println("Registration successful for email: " + request.getEmail());
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            System.err.println("Registration failed for email: " + request.getEmail() + ", Error: " + e.getMessage());
            return ResponseEntity.badRequest().body("Error: " + e.getMessage());
        }
    }

    @PostMapping("/create-admin")
    public ResponseEntity<?> createAdmin(@RequestBody RegisterRequest request) {
        try {
            // Check if any admin users exist
            long adminCount = userRepository.countByRole(User.Role.ADMIN);
            if (adminCount > 0) {
                return ResponseEntity.badRequest().body("Admin users already exist");
            }

            // Create admin user
            request.setRole(User.Role.ADMIN);
            AuthResponse response = authService.register(request);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Error: " + e.getMessage());
        }
    }

    @GetMapping("/check-admin")
    public ResponseEntity<?> checkAdminExists() {
        long adminCount = userRepository.countByRole(User.Role.ADMIN);
        return ResponseEntity.ok(Map.of(
                "adminExists", adminCount > 0,
                "adminCount", adminCount
        ));
    }

    @PostMapping("/promote-to-admin")
    public ResponseEntity<?> promoteCurrentUserToAdmin() {
        try {
            // Only allow this if no admin users exist
            long adminCount = userRepository.countByRole(User.Role.ADMIN);
            if (adminCount > 0) {
                return ResponseEntity.badRequest().body("Admin users already exist. Cannot promote user.");
            }

            // Get current user from JWT token
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            if (authentication == null || authentication.getName() == null) {
                return ResponseEntity.badRequest().body("No authenticated user found");
            }

            Optional<User> userOpt = userRepository.findByEmail(authentication.getName());
            if (userOpt.isEmpty()) {
                return ResponseEntity.badRequest().body("Current user not found");
            }

            User user = userOpt.get();
            user.setRole(User.Role.ADMIN);
            userRepository.save(user);

            return ResponseEntity.ok(Map.of(
                    "message", "User promoted to admin successfully",
                    "user", user.getEmail(),
                    "role", user.getRole()
            ));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Error: " + e.getMessage());
        }
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@Valid @RequestBody AuthRequest request) {
        try {
            AuthResponse response = authService.login(request);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Error: " + e.getMessage());
        }
    }
}
