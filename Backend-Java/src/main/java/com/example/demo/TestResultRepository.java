package com.example.demo;

import org.springframework.data.jpa.repository.JpaRepository;

public interface TestResultRepository extends JpaRepository<TestResultEntity, Long> {
    java.util.Optional<TestResultEntity> findFirstByTestCaseIdOrderByCreatedAtDesc(Long testCaseId);

    void deleteByTestCaseId(Long testCaseId);
}
