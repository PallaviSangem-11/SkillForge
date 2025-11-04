package com.skillforge.service;

import com.skillforge.entity.Course;
import com.skillforge.entity.CourseEnrollment;
import com.skillforge.entity.QuizAttempt;
import com.skillforge.repository.CourseEnrollmentRepository;
import com.skillforge.repository.CourseRepository;
import com.skillforge.repository.QuizAttemptRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;

@Service
public class RecommendationService {

	@Autowired
	private QuizAttemptRepository quizAttemptRepository;

	@Autowired
	private CourseRepository courseRepository;

	@Autowired
	private CourseEnrollmentRepository enrollmentRepository;

	/**
	 * Recommend courses for a student.
	 * Strategy:
	 *  - Group attempts by course (via attempt.quiz.course)
	 *  - If avg score for a course < threshold, recommend revisiting that course
	 *  - Also recommend courses the student is not enrolled in
	 */
	public List<Course> recommendForStudent(Long studentId) {
		if (studentId == null) return new ArrayList<>();

		// try to fetch attempts with quiz->course eagerly (if available)
		List<QuizAttempt> attempts;
		try {
			attempts = quizAttemptRepository.findByStudentIdWithQuizCourse(studentId);
		} catch (Throwable t) {
			// fallback if the custom method is not present
			try {
				attempts = quizAttemptRepository.findByStudentId(studentId);
			} catch (Throwable t2) {
				attempts = new ArrayList<>();
			}
		}

		// Group attempts by course id
		Map<Long, List<QuizAttempt>> byCourse = new HashMap<>();
		if (attempts != null) {
			for (QuizAttempt a : attempts) {
				if (a == null || a.getQuiz() == null || a.getQuiz().getCourse() == null) continue;
				Long cid = a.getQuiz().getCourse().getId();
				byCourse.computeIfAbsent(cid, k -> new ArrayList<>()).add(a);
			}
		}

		// Collect recommended course ids preserving insertion order
		LinkedHashSet<Long> recommendedCourseIds = new LinkedHashSet<>();

		// Recommend courses where average score is below threshold
		final double REVIEW_THRESHOLD = 70.0;
		for (Map.Entry<Long, List<QuizAttempt>> e : byCourse.entrySet()) {
			double avg = e.getValue().stream()
					.mapToDouble(x -> x.getScore() == null ? 0.0 : x.getScore())
					.average().orElse(0.0);
			if (avg < REVIEW_THRESHOLD) {
				recommendedCourseIds.add(e.getKey());
			}
		}

		// Recommend courses student is not enrolled in (complementary suggestions)
		List<CourseEnrollment> enrolled = new ArrayList<>();
		try {
			enrolled = enrollmentRepository.findByStudentId(studentId);
		} catch (Throwable ignored) {
			// method may not exist in some repo variants
		}
		Set<Long> enrolledCourseIds = new HashSet<>();
		if (enrolled != null) {
			for (CourseEnrollment ce : enrolled) {
				if (ce != null && ce.getCourse() != null) enrolledCourseIds.add(ce.getCourse().getId());
			}
		}

		List<Course> allCourses = new ArrayList<>();
		try {
			allCourses = courseRepository.findAll();
		} catch (Throwable ignored) {
			allCourses = new ArrayList<>();
		}

		for (Course c : allCourses) {
			if (c == null) continue;
			if (!enrolledCourseIds.contains(c.getId())) {
				recommendedCourseIds.add(c.getId());
			}
		}

		// Resolve ids to Course objects
		List<Course> out = new ArrayList<>();
		for (Long id : recommendedCourseIds) {
			Optional<Course> opt = courseRepository.findById(id);
			opt.ifPresent(out::add);
		}
		return out;
	}
}
