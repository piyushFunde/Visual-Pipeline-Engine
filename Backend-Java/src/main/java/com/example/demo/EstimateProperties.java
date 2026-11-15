package com.example.demo;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

import java.util.HashMap;
import java.util.Map;

@Component
@ConfigurationProperties(prefix = "pipeline.estimate")
public class EstimateProperties {
    private Map<String, Integer> baseLatencyMs = new HashMap<>();

    public Map<String, Integer> getBaseLatencyMs() { return baseLatencyMs; }
    public void setBaseLatencyMs(Map<String, Integer> baseLatencyMs) { this.baseLatencyMs = baseLatencyMs; }
}
