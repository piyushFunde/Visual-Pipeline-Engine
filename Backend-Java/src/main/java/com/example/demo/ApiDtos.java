package com.example.demo;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.util.List;
import java.util.Map;

public final class ApiDtos {
    private ApiDtos() {
    }

    public record TestCaseRequest(@NotBlank String name, Map<String, Object> inputs,
                                  @NotNull List<Map<String, Object>> assertions) {
    }

    public record TestResultResponse(Long runId, boolean passed, List<Map<String, Object>> failures,
                                     String createdAt) {
    }

    public record TestCaseResponse(Long id, Long pipelineId, String name, Map<String, Object> inputs,
                                   List<Map<String, Object>> assertions, TestResultResponse latestResult) {
    }

    public record RunStepResponse(Long id, int orderIndex, String nodeId, String nodeType, String status,
                                  String inputJson, String outputJson, Long durationMs, Integer tokens,
                                  String errorMessage) {
    }

    public record RunResponse(Long id, Long pipelineId, String status, String startedAt,
                              Long totalMs, boolean simulated, List<RunStepResponse> steps) {
    }

    public record IssueResponse(String id, String severity, String code, String nodeId, String title,
                                String detail, FixDescriptor fix) {
    }

    public record FixDescriptor(String label, List<Map<String, Object>> ops) {
    }
}
