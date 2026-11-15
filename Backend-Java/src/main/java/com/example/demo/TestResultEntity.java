package com.example.demo;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import java.time.Instant;

@Entity
@Table(name = "pipeline_test_results")
public class TestResultEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Long testCaseId;
    private Long runId;
    private boolean passed;

    @Column(columnDefinition = "TEXT")
    private String failuresJson;

    private Instant createdAt;

    public TestResultEntity() {
    }

    public TestResultEntity(Long testCaseId, Long runId, boolean passed, String failuresJson, Instant createdAt) {
        this.testCaseId = testCaseId;
        this.runId = runId;
        this.passed = passed;
        this.failuresJson = failuresJson;
        this.createdAt = createdAt;
    }

    public Long getTestCaseId() { return testCaseId; }
    public Long getRunId() { return runId; }
    public boolean isPassed() { return passed; }
    public String getFailuresJson() { return failuresJson; }
    public Instant getCreatedAt() { return createdAt; }
}
