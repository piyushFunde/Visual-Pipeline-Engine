package com.example.demo;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpSession;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
public class PipelineController {

    private final DagValidationService dagValidationService;
    private final ExecutionService executionService;
    private final PipelineRepository pipelineRepository;
    private final ObjectMapper mapper;

    public PipelineController(DagValidationService dagValidationService, ExecutionService executionService,
                              PipelineRepository pipelineRepository, ObjectMapper mapper) {
        this.dagValidationService = dagValidationService;
        this.executionService = executionService;
        this.pipelineRepository = pipelineRepository;
        this.mapper = mapper;
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
    public Map<String, Object> savePipeline(@RequestParam("pipeline") String pipeline,
                                            @RequestParam(value = "name", required = false) String name,
                                            HttpServletRequest request) {
        Map<String, Object> response = new HashMap<>();
        try {
            JsonNode root = mapper.readTree(pipeline);
            String nodes = root.get("nodes").toString();
            String edges = root.get("edges").toString();
            HttpSession session = request.getSession(false);
            Long accountId = (session != null && session.getAttribute("accountId") instanceof Long id) ? id : null;
            PipelineEntity entity = new PipelineEntity(accountId, nodes, edges);
            if (name != null && !name.isBlank()) entity.setName(name);
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
    public List<PipelineEntity> getPipelines(HttpServletRequest request) {
        HttpSession session = request.getSession(false);
        if (session != null && session.getAttribute("accountId") instanceof Long accountId) {
            return pipelineRepository.findByAccountId(accountId);
        }
        return pipelineRepository.findAll();
    }

    @GetMapping("/pipelines/{id}")
    public Map<String, Object> getPipeline(@PathVariable("id") long id) {
        Map<String, Object> response = new HashMap<>();
        Optional<PipelineEntity> entity = pipelineRepository.findById(id);
        if (entity.isPresent()) {
            response.put("status", "success");
            response.put("id", entity.get().getId());
            response.put("name", entity.get().getName());
            response.put("nodes", entity.get().getNodesJson());
            response.put("edges", entity.get().getEdgesJson());
        } else {
            response.put("status", "error");
            response.put("message", "Pipeline not found");
        }
        return response;
    }

    @PutMapping("/pipelines/{id}")
    public ResponseEntity<Map<String, Object>> updatePipeline(@PathVariable("id") long id,
                                                              @RequestBody Map<String, Object> body) {
        return pipelineRepository.findById(id).map(entity -> {
            try {
                if (body.containsKey("name")) entity.setName((String) body.get("name"));
                if (body.containsKey("description")) entity.setDescription((String) body.get("description"));
                if (body.containsKey("nodes")) entity.setNodesJson(mapper.writeValueAsString(body.get("nodes")));
                if (body.containsKey("edges")) entity.setEdgesJson(mapper.writeValueAsString(body.get("edges")));
                pipelineRepository.save(entity);
                return ResponseEntity.ok(Map.<String, Object>of("status", "success", "id", entity.getId()));
            } catch (Exception e) {
                return ResponseEntity.ok(Map.<String, Object>of("status", "error", "message", e.getMessage()));
            }
        }).orElse(ResponseEntity.ok(Map.of("status", "error", "message", "Pipeline not found")));
    }

    @DeleteMapping("/pipelines/{id}")
    public Map<String, Object> deletePipeline(@PathVariable("id") long id) {
        if (!pipelineRepository.existsById(id)) {
            return Map.of("status", "error", "message", "Pipeline not found");
        }
        pipelineRepository.deleteById(id);
        return Map.of("status", "success");
    }

    @PostMapping("/pipelines/{id}/duplicate")
    public Map<String, Object> duplicatePipeline(@PathVariable("id") long id, HttpServletRequest request) {
        Optional<PipelineEntity> source = pipelineRepository.findById(id);
        if (source.isEmpty()) return Map.of("status", "error", "message", "Pipeline not found");
        HttpSession session = request.getSession(false);
        Long accountId = (session != null && session.getAttribute("accountId") instanceof Long aid) ? aid : null;
        PipelineEntity copy = new PipelineEntity(accountId, source.get().getNodesJson(), source.get().getEdgesJson());
        String srcName = source.get().getName();
        copy.setName(srcName != null ? srcName + " (copy)" : "Copy");
        pipelineRepository.save(copy);
        return Map.of("status", "success", "id", copy.getId());
    }

    @PostMapping("/pipelines/execute")
    public Map<String, Object> executePipeline(@RequestParam("pipeline") String pipeline,
                                               @RequestParam(value = "pipelineId", required = false) Long pipelineId) {
        Map<String, Object> validation = dagValidationService.parseAndValidate(pipeline);
        if (!(Boolean) validation.getOrDefault("is_dag", false)) {
            validation.put("status", "error");
            validation.put("message", "Pipeline is not a valid DAG. Cannot execute.");
            return validation;
        }
        @SuppressWarnings("unchecked")
        List<String> order = (List<String>) validation.get("execution_order");
        return executionService.executePipeline(pipeline, order, pipelineId, Collections.emptyMap());
    }

    /** Public REST API endpoint: POST /api/v1/pipelines/{id}/execute */
    @PostMapping("/api/v1/pipelines/{id}/execute")
    public ResponseEntity<Map<String, Object>> publicExecute(@PathVariable("id") long id,
                                                             @RequestBody(required = false) Map<String, Object> body) {
        Optional<PipelineEntity> entity = pipelineRepository.findById(id);
        if (entity.isEmpty()) {
            return ResponseEntity.ok(Map.of("status", "error", "message", "Pipeline not found"));
        }
        String pipelineJson = "{\"nodes\":" + entity.get().getNodesJson() + ",\"edges\":" + entity.get().getEdgesJson() + "}";
        Map<String, Object> validation = dagValidationService.parseAndValidate(pipelineJson);
        if (!(Boolean) validation.getOrDefault("is_dag", false)) {
            return ResponseEntity.ok(Map.of("status", "error", "message", "Pipeline is not a valid DAG."));
        }
        @SuppressWarnings("unchecked")
        List<String> order = (List<String>) validation.get("execution_order");
        @SuppressWarnings("unchecked")
        Map<String, Object> inputs = (body != null && body.get("inputs") instanceof Map<?, ?> m)
                ? (Map<String, Object>) m : Collections.emptyMap();
        Map<String, Object> result = executionService.executePipeline(pipelineJson, order, id, inputs);
        return ResponseEntity.ok(result);
    }
}
