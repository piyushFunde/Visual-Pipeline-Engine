package com.example.demo;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import java.time.Instant;

@Entity
@Table(name = "pipeline_runs")
public class RunEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Long pipelineId;
    private String status;
    private Instant startedAt;
    private Long totalMs;
    private boolean simulated;

    public RunEntity() {
    }

    public RunEntity(Long pipelineId, String status, Instant startedAt, Long totalMs, boolean simulated) {
        this.pipelineId = pipelineId;
        this.status = status;
        this.startedAt = startedAt;
        this.totalMs = totalMs;
        this.simulated = simulated;
    }

    public Long getId() { return id; }
    public Long getPipelineId() { return pipelineId; }
    public String getStatus() { return status; }
    public Instant getStartedAt() { return startedAt; }
    public Long getTotalMs() { return totalMs; }
    public boolean isSimulated() { return simulated; }
    public void setStatus(String status) { this.status = status; }
    public void setTotalMs(Long totalMs) { this.totalMs = totalMs; }
    public void setSimulated(boolean simulated) { this.simulated = simulated; }
}
