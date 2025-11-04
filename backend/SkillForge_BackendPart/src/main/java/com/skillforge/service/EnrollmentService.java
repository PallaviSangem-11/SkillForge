package com.skillforge.service;

import com.skillforge.entity.Course;
import com.skillforge.entity.CourseEnrollment;
import com.skillforge.entity.User;
import com.skillforge.repository.CourseEnrollmentRepository;
import com.skillforge.repository.CourseRepository;
import com.skillforge.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class EnrollmentService {

    @Autowired
    private CourseEnrollmentRepository enrollmentRepository;

    @Autowired
    private CourseRepository courseRepository;

    @Autowired
    private UserRepository userRepository;

    public CourseEnrollment enroll(Long courseId, Long studentId) {
        if (enrollmentRepository.existsByStudentIdAndCourseId(studentId, courseId)) {
            throw new RuntimeException("Already enrolled");
        }

        Course course = courseRepository.findById(courseId).orElseThrow(() -> new RuntimeException("Course not found"));
        User student = userRepository.findById(studentId).orElseThrow(() -> new RuntimeException("Student not found"));

        CourseEnrollment enrollment = new CourseEnrollment();
        enrollment.setCourse(course);
        enrollment.setStudent(student);
        enrollment.setEnrolledAt(LocalDateTime.now());

        return enrollmentRepository.save(enrollment);
    }

    public List<CourseEnrollment> getEnrollmentsForStudent(Long studentId) {
        return enrollmentRepository.findByStudentId(studentId);
    }

    public long getEnrollmentCount(Long courseId) {
        return enrollmentRepository.countByCourseId(courseId);
    }

    @org.springframework.transaction.annotation.Transactional
    public CourseEnrollment toggle(Long courseId, Long studentId) {
        Course course = courseRepository.findById(courseId).orElseThrow(() -> new RuntimeException("Course not found"));
        User student = userRepository.findById(studentId).orElseThrow(() -> new RuntimeException("Student not found"));

        CourseEnrollment existing = enrollmentRepository.findFirstByStudentIdAndCourseId(studentId, courseId);
        if (existing == null) {
            CourseEnrollment e = new CourseEnrollment();
            e.setCourse(course);
            e.setStudent(student);
            e.setEnrolledAt(LocalDateTime.now());
            return enrollmentRepository.save(e);
        }
        if (existing.getUnenrolledAt() == null) {
            existing.setUnenrolledAt(LocalDateTime.now());
        } else {
            existing.setEnrolledAt(LocalDateTime.now());
            existing.setUnenrolledAt(null);
        }
        return enrollmentRepository.save(existing);
    }

    public boolean isEnrolled(Long courseId, Long studentId) {
        CourseEnrollment e = enrollmentRepository.findFirstByStudentIdAndCourseId(studentId, courseId);
        return e != null && e.getUnenrolledAt() == null;
    }

    public CourseEnrollment getEnrollment(Long courseId, Long studentId) {
        return enrollmentRepository.findFirstByStudentIdAndCourseId(studentId, courseId);
    }

    // For admin/development: return all enrollments
    public List<CourseEnrollment> getAllEnrollments() {
        return enrollmentRepository.findAll();
    }
}
