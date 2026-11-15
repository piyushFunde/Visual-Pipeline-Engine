package com.example.demo;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "pipeline_test_cases")
public class TestCaseEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Long pipelineId;
    private String name;

    @Column(columnDefinition = "TEXT")
    private String inputsJson;

    @Column(columnDefinition = "TEXT")
    private String assertionsJson;

    public TestCaseEntity() {
    }

    public TestCaseEntity(Long pipelineId, String name, String inputsJson, String assertionsJson) {
        this.pipelineId = pipelineId;
        this.name = name;
        this.inputsJson = inputsJson;
        this.assertionsJson = assertionsJson;
    }

    public Long getId() { return id; }
    public Long getPipelineId() { return pipelineId; }
    public String getName() { return name; }
    public String getInputsJson() { return inputsJson; }
    public String getAssertionsJson() { return assertionsJson; }
    public void setName(String name) { this.name = name; }
    public void setInputsJson(String inputsJson) { this.inputsJson = inputsJson; }
    public void setAssertionsJson(String assertionsJson) { this.assertionsJson = assertionsJson; }
}
