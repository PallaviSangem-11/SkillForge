package com.skillforge.repository;

import com.skillforge.entity.Course;
import com.skillforge.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CourseRepository extends JpaRepository<Course, Long> {
    
    List<Course> findByInstructor(User instructor);
    
    List<Course> findByInstructorId(Long instructorId);
    
}
