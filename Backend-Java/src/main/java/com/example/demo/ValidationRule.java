package com.example.demo;

import com.fasterxml.jackson.databind.JsonNode;

import java.util.List;

public interface ValidationRule {
    List<ApiDtos.IssueResponse> validate(JsonNode nodes, JsonNode edges);
}
