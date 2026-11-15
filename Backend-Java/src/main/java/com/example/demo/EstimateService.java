package com.example.demo;

import com.fasterxml.jackson.databind.JsonNode;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
public class EstimateService {
    private final EstimateProperties properties;

    public EstimateService(EstimateProperties properties) {
        this.properties = properties;
    }

    public Map<String, Object> estimate(JsonNode graph) {
        List<Map<String, Object>> nodes = new ArrayList<>();
        int totalMs = 0;
        int totalTokens = 0;
        JsonNode nodeArray = graph.path("nodes");
        if (nodeArray.isArray()) {
            for (JsonNode node : nodeArray) {
                String type = node.path("type").asText("unknown");
                JsonNode data = node.path("data");
                int promptTokens = promptLength(data) / 4;
                int latency = properties.getBaseLatencyMs().getOrDefault(type, 10);
                Map<String, Object> estimate = new LinkedHashMap<>();
                estimate.put("nodeId", node.path("id").asText());
                estimate.put("estimatedMs", latency);
                estimate.put("estimatedTokens", promptTokens);
                nodes.add(estimate);
                totalMs += latency;
                totalTokens += promptTokens;
            }
        }
        Map<String, Object> response = new LinkedHashMap<>();
        response.put("nodes", nodes);
        response.put("total", Map.of("estimatedMs", totalMs, "estimatedTokens", totalTokens));
        response.put("isEstimate", true);
        response.put("method", "Per-node latency uses configured node-type baselines; prompt tokens are character length divided by four.");
        return response;
    }

    private int promptLength(JsonNode data) {
        String text = data.path("prompt").asText(data.path("text").asText(""));
        return text.length();
    }
}
