package com.example.demo;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;

@RestController
public class TestCaseController {
    private final TestCaseRepository testCaseRepository;
    private final TestResultRepository testResultRepository;
    private final PipelineRepository pipelineRepository;
    private final RunRepository runRepository;
    private final RunStepRepository runStepRepository;
    private final DagValidationService dagValidationService;
    private final ExecutionService executionService;
    private final ObjectMapper mapper;

    public TestCaseController(TestCaseRepository testCaseRepository, TestResultRepository testResultRepository,
                              PipelineRepository pipelineRepository, RunRepository runRepository,
                              RunStepRepository runStepRepository, DagValidationService dagValidationService,
                              ExecutionService executionService, ObjectMapper mapper) {
        this.testCaseRepository = testCaseRepository;
        this.testResultRepository = testResultRepository;
        this.pipelineRepository = pipelineRepository;
        this.runRepository = runRepository;
        this.runStepRepository = runStepRepository;
        this.dagValidationService = dagValidationService;
        this.executionService = executionService;
        this.mapper = mapper;
    }

    @GetMapping("/pipelines/{pipelineId}/tests")
    public List<ApiDtos.TestCaseResponse> list(@PathVariable long pipelineId) {
        requirePipeline(pipelineId);
        return testCaseRepository.findByPipelineIdOrderByIdAsc(pipelineId).stream()
                .map(this::toResponse).toList();
    }

    @PostMapping("/pipelines/{pipelineId}/tests")
    public ApiDtos.TestCaseResponse create(@PathVariable long pipelineId,
                                           @Valid @RequestBody ApiDtos.TestCaseRequest request) {
        requirePipeline(pipelineId);
        return toResponse(testCaseRepository.save(new TestCaseEntity(pipelineId, request.name(),
                writeJson(request.inputs() == null ? Map.of() : request.inputs()),
                writeJson(request.assertions() == null ? List.of() : request.assertions()))));
    }

    @PutMapping("/pipelines/{pipelineId}/tests/{testId}")
    public ApiDtos.TestCaseResponse update(@PathVariable long pipelineId, @PathVariable long testId,
                                           @Valid @RequestBody ApiDtos.TestCaseRequest request) {
        TestCaseEntity testCase = getTestCase(pipelineId, testId);
        testCase.setName(request.name());
        testCase.setInputsJson(writeJson(request.inputs() == null ? Map.of() : request.inputs()));
        testCase.setAssertionsJson(writeJson(request.assertions() == null ? List.of() : request.assertions()));
        return toResponse(testCaseRepository.save(testCase));
    }

    @DeleteMapping("/pipelines/{pipelineId}/tests/{testId}")
    public Map<String, Object> delete(@PathVariable long pipelineId, @PathVariable long testId) {
        TestCaseEntity testCase = getTestCase(pipelineId, testId);
        testResultRepository.deleteByTestCaseId(testId);
        testCaseRepository.delete(testCase);
        return Map.of("status", "success", "id", testId);
    }

    @PostMapping("/pipelines/{pipelineId}/tests/run")
    @Transactional
    public Map<String, Object> runAll(@PathVariable long pipelineId) {
        PipelineEntity pipeline = requirePipeline(pipelineId);
        String graph = graphJson(pipeline);
        Map<String, Object> validation = dagValidationService.parseAndValidate(graph);
        if (!Boolean.TRUE.equals(validation.get("is_dag"))) {
            throw new IllegalArgumentException("Saved pipeline is not a valid DAG.");
        }
        @SuppressWarnings("unchecked")
        List<String> order = (List<String>) validation.get("execution_order");

        List<Map<String, Object>> results = new ArrayList<>();
        for (TestCaseEntity testCase : testCaseRepository.findByPipelineIdOrderByIdAsc(pipelineId)) {
            Map<String, Object> inputs = readMap(testCase.getInputsJson());
            Map<String, Object> runResponse = executionService.executePipeline(graph, order, pipelineId, inputs);
            List<Map<String, Object>> failures = evaluateAssertions(testCase, runResponse);
            boolean passed = failures.isEmpty();
            testResultRepository.save(new TestResultEntity(testCase.getId(),
                    ((Number) runResponse.get("runId")).longValue(), passed, writeJson(failures), Instant.now()));
            Map<String, Object> caseResult = new LinkedHashMap<>();
            caseResult.put("testCaseId", testCase.getId());
            caseResult.put("name", testCase.getName());
            caseResult.put("passed", passed);
            caseResult.put("failures", failures);
            caseResult.put("runId", runResponse.get("runId"));
            results.add(caseResult);
        }
        return Map.of("pipelineId", pipelineId, "results", results);
    }

    @PostMapping("/pipelines/{pipelineId}/tests/from-run/{runId}")
    public ApiDtos.TestCaseResponse fromRun(@PathVariable long pipelineId, @PathVariable long runId) {
        requirePipeline(pipelineId);
        RunEntity run = runRepository.findById(runId)
                .orElseThrow(() -> new ResourceNotFoundException("Run not found"));
        if (run.getPipelineId() != null && !Objects.equals(run.getPipelineId(), pipelineId)) {
            throw new IllegalArgumentException("Run does not belong to this pipeline.");
        }
        List<Map<String, Object>> assertions = new ArrayList<>();
        assertions.add(Map.of("type", "noError"));
        for (RunStepEntity step : runStepRepository.findByRunIdOrderByOrderIndexAsc(runId)) {
            if (!"customOutput".equals(step.getNodeType()) && !"output".equals(step.getNodeType())) continue;
            Object value = readMap(step.getOutputJson()).get("value");
            assertions.add(Map.of("type", "outputEquals", "nodeId", step.getNodeId(), "expected", value == null ? "" : value));
        }
        TestCaseEntity created = testCaseRepository.save(new TestCaseEntity(pipelineId,
                "Test from run " + runId, writeJson(Map.of()), writeJson(assertions)));
        return toResponse(created);
    }

    private List<Map<String, Object>> evaluateAssertions(TestCaseEntity testCase, Map<String, Object> run) {
        List<Map<String, Object>> failures = new ArrayList<>();
        JsonNode assertions = readTree(testCase.getAssertionsJson());
        List<?> logs = (List<?>) run.get("logs");
        for (JsonNode assertion : assertions) {
            String type = assertion.path("type").asText();
            String nodeId = assertion.path("nodeId").asText("");
            Object actual = actualValue(type, assertion, logs, run);
            Object expected = assertion.has("expected") ? mapper.convertValue(assertion.get("expected"), Object.class)
                    : assertion.has("handle") ? assertion.path("handle").asText()
                    : assertion.has("maxDurationMs") ? assertion.path("maxDurationMs").asLong() : null;
            boolean passed = switch (type) {
                case "outputEquals" -> Objects.equals(normalize(actual), normalize(expected));
                case "outputContains" -> actual != null && expected != null
                        && actual.toString().contains(expected.toString());
                case "branchTaken" -> Objects.equals(actual, expected);
                case "noError" -> "success".equals(run.get("status"));
                case "maxDurationMs" -> actual instanceof Number number && expected instanceof Number limit
                        && number.longValue() <= limit.longValue();
                default -> false;
            };
            if (!passed) {
                Map<String, Object> failure = new LinkedHashMap<>();
                failure.put("assertion", assertion);
                failure.put("expected", expected);
                failure.put("actual", actual);
                failures.add(failure);
            }
        }
        return failures;
    }

    private Object actualValue(String type, JsonNode assertion, List<?> logs, Map<String, Object> run) {
        if ("noError".equals(type)) return run.get("status");
        if ("maxDurationMs".equals(type)) return run.get("totalMs");
        String nodeId = assertion.path("nodeId").asText("");
        if (nodeId.isBlank() && !"branchTaken".equals(type)) {
            for (int index = logs.size() - 1; index >= 0; index--) {
                Map<?, ?> log = (Map<?, ?>) logs.get(index);
                if (!"customOutput".equals(log.get("type")) && !"output".equals(log.get("type"))) continue;
                return extractValue(log.get("output"));
            }
        }
        for (Object item : logs) {
            Map<?, ?> log = (Map<?, ?>) item;
            if (!nodeId.isBlank() && !nodeId.equals(log.get("nodeId"))) continue;
            if ("branchTaken".equals(type)) return log.get("branchTaken");
            return extractValue(log.get("output"));
        }
        return null;
    }

    private Object extractValue(Object output) {
        if (output instanceof Map<?, ?> outputMap) {
            return outputMap.containsKey("value") ? outputMap.get("value")
                    : outputMap.containsKey("text") ? outputMap.get("text") : output;
        }
        return output;
    }

    private Object normalize(Object value) {
        if (value instanceof Map<?, ?> map && map.containsKey("value")) return map.get("value");
        return value;
    }

    private PipelineEntity requirePipeline(long id) {
        return pipelineRepository.findById(id).orElseThrow(() -> new ResourceNotFoundException("Pipeline not found"));
    }

    private TestCaseEntity getTestCase(long pipelineId, long testId) {
        requirePipeline(pipelineId);
        TestCaseEntity testCase = testCaseRepository.findById(testId)
                .orElseThrow(() -> new ResourceNotFoundException("Test case not found"));
        if (!Objects.equals(testCase.getPipelineId(), pipelineId)) {
            throw new ResourceNotFoundException("Test case not found");
        }
        return testCase;
    }

    private ApiDtos.TestCaseResponse toResponse(TestCaseEntity testCase) {
        ApiDtos.TestResultResponse latestResult = testResultRepository
                .findFirstByTestCaseIdOrderByCreatedAtDesc(testCase.getId())
                .map(result -> new ApiDtos.TestResultResponse(result.getRunId(), result.isPassed(),
                        readList(result.getFailuresJson()), result.getCreatedAt().toString()))
                .orElse(null);
        return new ApiDtos.TestCaseResponse(testCase.getId(), testCase.getPipelineId(), testCase.getName(),
                readMap(testCase.getInputsJson()), readList(testCase.getAssertionsJson()), latestResult);
    }

    private String graphJson(PipelineEntity pipeline) {
        try {
            JsonNode graph = mapper.createObjectNode().set("nodes", mapper.readTree(pipeline.getNodesJson()));
            ((com.fasterxml.jackson.databind.node.ObjectNode) graph).set("edges", mapper.readTree(pipeline.getEdgesJson()));
            return mapper.writeValueAsString(graph);
        } catch (JsonProcessingException exception) {
            throw new IllegalStateException("Saved pipeline contains invalid JSON.", exception);
        }
    }

    private String writeJson(Object value) {
        try {
            return mapper.writeValueAsString(value);
        } catch (JsonProcessingException exception) {
            throw new IllegalStateException("Could not serialize test case data.", exception);
        }
    }

    private JsonNode readTree(String json) {
        try {
            return mapper.readTree(json);
        } catch (JsonProcessingException exception) {
            throw new IllegalStateException("Stored test case contains invalid JSON.", exception);
        }
    }

    private Map<String, Object> readMap(String json) {
        return mapper.convertValue(readTree(json), mapper.getTypeFactory()
                .constructMapType(Map.class, String.class, Object.class));
    }

    private List<Map<String, Object>> readList(String json) {
        return mapper.convertValue(readTree(json), mapper.getTypeFactory()
                .constructCollectionType(List.class, mapper.getTypeFactory()
                        .constructMapType(Map.class, String.class, Object.class)));
    }
}
