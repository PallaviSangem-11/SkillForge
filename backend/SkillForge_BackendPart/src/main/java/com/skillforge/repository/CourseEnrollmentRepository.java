package com.skillforge.repository;

import com.skillforge.entity.CourseEnrollment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CourseEnrollmentRepository extends JpaRepository<CourseEnrollment, Long> {
    List<CourseEnrollment> findByStudentId(Long studentId);
    boolean existsByStudentIdAndCourseId(Long studentId, Long courseId);
    CourseEnrollment findFirstByStudentIdAndCourseId(Long studentId, Long courseId);
    List<CourseEnrollment> findByCourseId(Long courseId);
    long countByCourseId(Long courseId);
    long countByStudentId(Long studentId);
}
