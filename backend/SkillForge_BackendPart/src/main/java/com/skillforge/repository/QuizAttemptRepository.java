package com.skillforge.repository;

import com.skillforge.entity.QuizAttempt;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Repository
public interface QuizAttemptRepository extends JpaRepository<QuizAttempt, Long> {

    List<QuizAttempt> findByStudentId(Long studentId);

    @org.springframework.data.jpa.repository.Query("SELECT a FROM QuizAttempt a LEFT JOIN FETCH a.quiz q LEFT JOIN FETCH q.course WHERE a.student.id = :studentId ORDER BY a.attemptedAt DESC")
    List<QuizAttempt> findByStudentIdWithQuizCourse(@org.springframework.data.repository.query.Param("studentId") Long studentId);

    List<QuizAttempt> findByQuizId(Long quizId);

    @org.springframework.data.jpa.repository.Query("SELECT a FROM QuizAttempt a WHERE a.quiz.course.id = :courseId")
    List<QuizAttempt> findByQuizCourseId(@org.springframework.data.repository.query.Param("courseId") Long courseId);

    @org.springframework.data.jpa.repository.Query("SELECT AVG(a.score) FROM QuizAttempt a WHERE a.quiz.course.id = :courseId")
    Double findAverageScoreByCourseId(@org.springframework.data.repository.query.Param("courseId") Long courseId);

    @Modifying
    @Transactional
    @Query("DELETE FROM QuizAttempt qa WHERE qa.quiz.course.id = :courseId")
    void deleteAllByCourseId(@Param("courseId") Long courseId);

    @Query("SELECT COUNT(qa) FROM QuizAttempt qa WHERE qa.quiz.course.id = :courseId")
    Long countByCourseId(@Param("courseId") Long courseId);
}
