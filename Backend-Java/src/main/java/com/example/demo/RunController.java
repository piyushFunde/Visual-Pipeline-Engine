package com.example.demo;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RestController;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@RestController
public class RunController {
    private final RunRepository runRepository;
    private final RunStepRepository runStepRepository;
    private final PipelineRepository pipelineRepository;

    public RunController(RunRepository runRepository, RunStepRepository runStepRepository,
                         PipelineRepository pipelineRepository) {
        this.runRepository = runRepository;
        this.runStepRepository = runStepRepository;
        this.pipelineRepository = pipelineRepository;
    }

    @GetMapping("/pipelines/{id}/runs")
    public List<Map<String, Object>> listRuns(@PathVariable long id) {
        if (!pipelineRepository.existsById(id)) throw new ResourceNotFoundException("Pipeline not found");
        return runRepository.findByPipelineIdOrderByStartedAtDesc(id).stream().map(run -> {
            Map<String, Object> summary = new LinkedHashMap<>();
            summary.put("id", run.getId());
            summary.put("pipelineId", run.getPipelineId());
            summary.put("status", run.getStatus());
            summary.put("startedAt", run.getStartedAt());
            summary.put("totalMs", run.getTotalMs());
            summary.put("simulated", run.isSimulated());
            return summary;
        }).toList();
    }

    @GetMapping("/runs/{runId}")
    public ApiDtos.RunResponse getRun(@PathVariable long runId) {
        RunEntity run = runRepository.findById(runId)
                .orElseThrow(() -> new ResourceNotFoundException("Run not found"));
        List<ApiDtos.RunStepResponse> steps = runStepRepository.findByRunIdOrderByOrderIndexAsc(runId)
                .stream().map(step -> new ApiDtos.RunStepResponse(step.getId(), step.getOrderIndex(),
                        step.getNodeId(), step.getNodeType(), step.getStatus(), step.getInputJson(),
                        step.getOutputJson(), step.getDurationMs(), step.getTokens(), step.getErrorMessage()))
                .toList();
        return new ApiDtos.RunResponse(run.getId(), run.getPipelineId(), run.getStatus(),
                run.getStartedAt().toString(), run.getTotalMs(), run.isSimulated(), steps);
    }
}
