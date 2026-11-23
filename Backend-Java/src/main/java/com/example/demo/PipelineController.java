package com.example.demo;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpSession;
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
                                            HttpServletRequest request) {
        Map<String, Object> response = new HashMap<>();
        try {
            JsonNode root = mapper.readTree(pipeline);
            String nodes = root.get("nodes").toString();
            String edges = root.get("edges").toString();
            HttpSession session = request.getSession(false);
            Long accountId = (session != null && session.getAttribute("accountId") instanceof Long id) ? id : null;
            PipelineEntity entity = new PipelineEntity(accountId, nodes, edges);
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
            response.put("nodes", entity.get().getNodesJson());
            response.put("edges", entity.get().getEdgesJson());
        } else {
            response.put("status", "error");
            response.put("message", "Pipeline not found");
        }
        return response;
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
        Map<String, Object> inputs = Collections.emptyMap();
        return executionService.executePipeline(pipeline, order, pipelineId, inputs);
    }
}
