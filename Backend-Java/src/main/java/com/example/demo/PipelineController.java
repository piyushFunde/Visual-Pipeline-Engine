package com.example.demo;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@CrossOrigin(origins = "http://localhost:3000")
public class PipelineController {

    private final DagValidationService dagValidationService;
    private final ExecutionService executionService;
    private final PipelineRepository pipelineRepository;
    private final ObjectMapper mapper = new ObjectMapper();

    public PipelineController(DagValidationService dagValidationService, ExecutionService executionService, PipelineRepository pipelineRepository) {
        this.dagValidationService = dagValidationService;
        this.executionService = executionService;
        this.pipelineRepository = pipelineRepository;
    }

    @GetMapping("/")
    public Map<String, String> root() {
        return Map.of("Ping", "Pong");
    }

    @PostMapping("/pipelines/parse")
    public Map<String, Object> parsePipeline(@RequestParam("pipeline") String pipeline) {
        return dagValidationService.parseAndValidate(pipeline);
    }

    @PostMapping("/pipelines/save")
    public Map<String, Object> savePipeline(@RequestParam("pipeline") String pipeline) {
        Map<String, Object> response = new HashMap<>();
        try {
            JsonNode root = mapper.readTree(pipeline);
            String nodes = root.get("nodes").toString();
            String edges = root.get("edges").toString();
            PipelineEntity entity = new PipelineEntity(nodes, edges);
            pipelineRepository.save(entity);
            response.put("status", "success");
            response.put("id", entity.getId());
        } catch (Exception e) {
            response.put("status", "error");
            response.put("message", e.getMessage());
        }
        return response;
    }

    @GetMapping("/pipelines")
    public List<PipelineEntity> getPipelines() {
        return pipelineRepository.findAll();
    }

    @GetMapping("/pipelines/{id}")
    public Map<String, Object> getPipeline(@PathVariable("id") Long id) {
        Map<String, Object> response = new HashMap<>();
        Optional<PipelineEntity> entity = pipelineRepository.findById(id);
        if (entity.isPresent()) {
            response.put("status", "success");
            response.put("nodes", entity.get().getNodesJson());
            response.put("edges", entity.get().getEdgesJson());
        } else {
            response.put("status", "error");
            response.put("message", "Pipeline not found");
        }
        return response;
    }

    @PostMapping("/pipelines/execute")
    public Map<String, Object> executePipeline(@RequestParam("pipeline") String pipeline) {
        Map<String, Object> validation = dagValidationService.parseAndValidate(pipeline);
        if (!(Boolean) validation.getOrDefault("is_dag", false)) {
            validation.put("status", "error");
            validation.put("message", "Pipeline is not a valid DAG. Cannot execute.");
            return validation;
        }

        @SuppressWarnings("unchecked")
        List<String> order = (List<String>) validation.get("execution_order");
        return executionService.executePipeline(pipeline, order);
    }
}
