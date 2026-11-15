package com.example.demo;

import com.fasterxml.jackson.databind.JsonNode;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
public class FlowDoctorController {
    private final FlowDoctorService flowDoctorService;
    private final EstimateService estimateService;

    public FlowDoctorController(FlowDoctorService flowDoctorService, EstimateService estimateService) {
        this.flowDoctorService = flowDoctorService;
        this.estimateService = estimateService;
    }

    @PostMapping("/pipelines/validate")
    public Map<String, Object> validate(@Valid @RequestBody JsonNode graph) {
        return flowDoctorService.validate(graph);
    }

    @PostMapping("/pipelines/estimate")
    public Map<String, Object> estimate(@Valid @RequestBody JsonNode graph) {
        return estimateService.estimate(graph);
    }
}
