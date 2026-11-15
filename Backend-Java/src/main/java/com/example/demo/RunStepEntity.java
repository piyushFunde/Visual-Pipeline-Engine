package com.example.demo;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "run_steps")
public class RunStepEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Long runId;
    private int orderIndex;
    private String nodeId;
    private String nodeType;
    private String status;

    @Column(columnDefinition = "TEXT")
    private String inputJson;

    @Column(columnDefinition = "TEXT")
    private String outputJson;

    private Long durationMs;
    private Integer tokens;

    @Column(columnDefinition = "TEXT")
    private String errorMessage;

    public RunStepEntity() {
    }

    public RunStepEntity(Long runId, int orderIndex, String nodeId, String nodeType, String status,
                         String inputJson, String outputJson, Long durationMs, Integer tokens, String errorMessage) {
        this.runId = runId;
        this.orderIndex = orderIndex;
        this.nodeId = nodeId;
        this.nodeType = nodeType;
        this.status = status;
        this.inputJson = inputJson;
        this.outputJson = outputJson;
        this.durationMs = durationMs;
        this.tokens = tokens;
        this.errorMessage = errorMessage;
    }

    public Long getId() { return id; }
    public Long getRunId() { return runId; }
    public int getOrderIndex() { return orderIndex; }
    public String getNodeId() { return nodeId; }
    public String getNodeType() { return nodeType; }
    public String getStatus() { return status; }
    public String getInputJson() { return inputJson; }
    public String getOutputJson() { return outputJson; }
    public Long getDurationMs() { return durationMs; }
    public Integer getTokens() { return tokens; }
    public String getErrorMessage() { return errorMessage; }
}
