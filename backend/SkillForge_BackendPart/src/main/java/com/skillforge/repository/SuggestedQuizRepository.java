package com.skillforge.repository;

import com.skillforge.entity.SuggestedQuiz;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface SuggestedQuizRepository extends JpaRepository<SuggestedQuiz, Long> {
    List<SuggestedQuiz> findByUserId(Long userId);
}
