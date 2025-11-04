package com.skillforge.controller;

import com.skillforge.entity.Feedback;
import com.skillforge.entity.Course;
import com.skillforge.entity.User;
import com.skillforge.repository.CourseRepository;
import com.skillforge.repository.FeedbackRepository;
import com.skillforge.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping("/api/courses")
@CrossOrigin(origins = "http://localhost:3000")
public class FeedbackController {

    @Autowired
    private FeedbackRepository feedbackRepository;

    @Autowired
    private CourseRepository courseRepository;

    @Autowired
    private UserRepository userRepository;

    @PostMapping("/{courseId}/feedback")
    public ResponseEntity<?> submitFeedback(@PathVariable Long courseId,
                                            @RequestParam Long userId,
                                            @RequestBody Feedback body) {
        Course course = courseRepository.findById(courseId).orElseThrow();
        User user = userRepository.findById(userId).orElseThrow();
        Feedback f = new Feedback();
        f.setCourse(course);
        f.setUser(user);
        f.setRating(body.getRating());
        f.setComments(body.getComments());
        f.setTopics(body.getTopics());
        f.setCreatedAt(LocalDateTime.now());
        return ResponseEntity.ok(feedbackRepository.save(f));
    }

    @GetMapping("/{courseId}/feedback")
    public ResponseEntity<List<Feedback>> listFeedback(@PathVariable Long courseId) {
        return ResponseEntity.ok(feedbackRepository.findByCourseId(courseId));
    }
}
