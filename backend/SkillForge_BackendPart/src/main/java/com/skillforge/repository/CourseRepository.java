package com.skillforge.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.skillforge.entity.Course;
import com.skillforge.entity.User;

@Repository
public interface CourseRepository extends JpaRepository<Course, Long> {

    List<Course> findByInstructor(User instructor);

    List<Course> findByInstructorId(Long instructorId);

    @Query("SELECT c FROM Course c LEFT JOIN FETCH c.quizzes q LEFT JOIN FETCH c.enrollments e LEFT JOIN FETCH c.feedbacks f LEFT JOIN FETCH c.suggestedQuizzes s WHERE c.id = :id")
    Optional<Course> findByIdWithDetails(@Param("id") Long id);

}
