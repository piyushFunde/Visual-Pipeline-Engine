package com.example.demo;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
public class FlowDoctorService {
    private final ObjectMapper mapper;
    private final List<ValidationRule> rules = ValidationRules.all();

    public FlowDoctorService(ObjectMapper mapper) {
        this.mapper = mapper;
    }

    public Map<String, Object> validate(JsonNode graph) {
        JsonNode nodes = graph.path("nodes");
        JsonNode edges = graph.path("edges");
        List<ApiDtos.IssueResponse> issues = new ArrayList<>();
        for (ValidationRule rule : rules) {
            issues.addAll(rule.validate(nodes, edges));
        }
        int deductions = issues.stream().mapToInt(issue -> switch (issue.severity()) {
            case "ERROR" -> 25;
            case "WARNING" -> 12;
            case "INFO" -> 4;
            default -> 0;
        }).sum();
        Map<String, Object> response = new LinkedHashMap<>();
        response.put("score", Math.max(0, 100 - deductions));
        response.put("issues", issues);
        return response;
    }
}
