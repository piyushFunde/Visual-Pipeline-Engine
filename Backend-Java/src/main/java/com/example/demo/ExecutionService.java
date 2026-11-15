package com.example.demo;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Service
public class ExecutionService {
    private static final Pattern COMPARISON = Pattern.compile("^\\s*([\\w.-]+)\\s*(>=|<=|==|!=|>|<)\\s*(.*?)\\s*$");

    private final ObjectMapper mapper;
    private final LlmClient llmClient;
    private final RunRepository runRepository;
    private final RunStepRepository runStepRepository;

    public ExecutionService(ObjectMapper mapper, LlmClient llmClient,
                            RunRepository runRepository, RunStepRepository runStepRepository) {
        this.mapper = mapper;
        this.llmClient = llmClient;
        this.runRepository = runRepository;
        this.runStepRepository = runStepRepository;
    }

    @Transactional
    public Map<String, Object> executePipeline(String pipelineJson, List<String> executionOrder,
                                               Long pipelineId, Map<String, Object> suppliedInputs) {
        long runStarted = System.nanoTime();
        RunEntity run = runRepository.save(new RunEntity(pipelineId, "RUNNING", Instant.now(), 0L, true));
        List<Map<String, Object>> executionLog = new ArrayList<>();
        Map<String, Map<String, Object>> outputs = new HashMap<>();
        Map<String, String> branches = new HashMap<>();
        Map<String, JsonNode> nodes = new LinkedHashMap<>();
        List<JsonNode> edges = new ArrayList<>();
        boolean hadError = false;
        boolean simulated = true;

        try {
            JsonNode root = mapper.readTree(pipelineJson);
            JsonNode nodeArray = root.path("nodes");
            if (nodeArray.isArray()) {
                for (JsonNode node : nodeArray) {
                    nodes.put(node.path("id").asText(), node);
                }
            }
            JsonNode edgeArray = root.path("edges");
            if (edgeArray.isArray()) {
                edgeArray.forEach(edges::add);
            }

            int orderIndex = 0;
            for (String nodeId : executionOrder) {
                JsonNode node = nodes.get(nodeId);
                if (node == null) {
                    continue;
                }

                String type = node.path("type").asText("unknown");
                Map<String, Object> inputs = collectInputs(nodeId, edges, branches, outputs, suppliedInputs);
                boolean skipped = shouldSkip(nodeId, edges, branches);
                // Node work is timed independently from graph traversal and database writes.
                long stepStarted = System.nanoTime();
                String status = skipped ? "SKIPPED" : "DONE";
                String errorMessage = null;
                Integer tokens = null;
                Map<String, Object> output = new LinkedHashMap<>();

                if (!skipped) {
                    try {
                        output = evaluate(type, node.path("data"), inputs, suppliedInputs);
                        if ("condition".equals(type)) {
                            String branch = Boolean.TRUE.equals(output.get("condition")) ? "true" : "false";
                            branches.put(nodeId, branch);
                        }
                        if ("llm".equals(type)) {
                            simulated = Boolean.TRUE.equals(output.get("simulated"));
                            Object tokenValue = output.get("tokens");
                            if (tokenValue instanceof Number number) {
                                tokens = number.intValue();
                            }
                        }
                        outputs.put(nodeId, output);
                    } catch (RuntimeException exception) {
                        status = "ERROR";
                        errorMessage = exception.getMessage();
                        hadError = true;
                    }
                }

                long durationMs = skipped ? 0L : (System.nanoTime() - stepStarted) / 1_000_000L;
                String inputJson = writeJson(inputs);
                String outputJson = writeJson(output);
                RunStepEntity step = runStepRepository.save(new RunStepEntity(
                        run.getId(), orderIndex++, nodeId, type, status, inputJson, outputJson,
                        durationMs, tokens, errorMessage));

                Map<String, Object> log = new LinkedHashMap<>();
                log.put("nodeId", nodeId);
                log.put("type", type);
                log.put("status", status);
                log.put("input", inputs);
                log.put("output", output);
                log.put("result", legacyResult(output));
                log.put("durationMs", durationMs);
                if (errorMessage != null) {
                    log.put("errorMessage", errorMessage);
                }
                if (branches.containsKey(nodeId)) {
                    log.put("branchTaken", branches.get(nodeId));
                }
                log.put("stepId", step.getId());
                executionLog.add(log);
            }

            run.setStatus(hadError ? "ERROR" : "DONE");
            run.setTotalMs((System.nanoTime() - runStarted) / 1_000_000L);
            run.setSimulated(simulated);
            runRepository.save(run);
            Map<String, Object> response = new LinkedHashMap<>();
            response.put("status", hadError ? "error" : "success");
            response.put("logs", executionLog);
            response.put("runId", run.getId());
            response.put("simulated", simulated);
            response.put("totalMs", run.getTotalMs());
            return response;
        } catch (Exception exception) {
            run.setStatus("ERROR");
            run.setTotalMs((System.nanoTime() - runStarted) / 1_000_000L);
            runRepository.save(run);
            throw new IllegalArgumentException("Engine failure: " + exception.getMessage(), exception);
        }
    }

    private Map<String, Object> evaluate(String type, JsonNode data, Map<String, Object> inputs,
                                         Map<String, Object> suppliedInputs) {
        Map<String, Object> output = new LinkedHashMap<>();
        switch (type) {
            case "customInput", "input" -> {
                String name = data.path("inputName").asText("");
                Object value = suppliedInputs.containsKey(name) ? suppliedInputs.get(name)
                        : suppliedInputs.getOrDefault(data.path("id").asText(), data.path("value").asText(""));
                output.put("value", value);
                output.put("name", name);
            }
            case "text" -> {
                String template = data.path("text").asText("");
                output.put("text", interpolate(template, inputs));
            }
            case "llm" -> {
                String prompt = data.path("prompt").asText(data.path("text").asText(""));
                if (prompt.isBlank() && !inputs.isEmpty()) {
                    prompt = inputs.values().iterator().next().toString();
                }
                LlmClient.LlmResponse response = llmClient.generate(interpolate(prompt, inputs), inputs);
                output.put("text", response.text());
                output.put("simulated", response.simulated());
                if (response.tokens() != null) {
                    output.put("tokens", response.tokens());
                }
            }
            case "condition" -> {
                boolean condition = evaluateCondition(data.path("expression").asText(""), inputs, data);
                output.put("condition", condition);
                output.put("branch", condition ? "true" : "false");
                output.put("value", firstValue(inputs));
            }
            case "customOutput", "output" -> output.put("value", firstValue(inputs));
            default -> {
                output.put("type", type);
                output.put("value", data.has("value") ? data.get("value").asText() : inputs);
            }
        }
        return output;
    }

    private Map<String, Object> collectInputs(String nodeId, List<JsonNode> edges, Map<String, String> branches,
                                              Map<String, Map<String, Object>> outputs,
                                              Map<String, Object> suppliedInputs) {
        Map<String, Object> inputs = new LinkedHashMap<>();
        for (JsonNode edge : edges) {
            if (!nodeId.equals(edge.path("target").asText())) {
                continue;
            }
            String source = edge.path("source").asText();
            String handle = normalizeHandle(edge.path("sourceHandle").asText(""), source);
            if (branches.containsKey(source) && ("true".equals(handle) || "false".equals(handle))
                    && !branches.get(source).equals(handle)) {
                continue;
            }
            if (outputs.containsKey(source)) {
                inputs.put(source, outputs.get(source));
                String targetHandle = normalizeHandle(edge.path("targetHandle").asText(""), nodeId);
                if (!targetHandle.isBlank()) {
                    inputs.put(targetHandle, outputs.get(source));
                }
            }
        }
        inputs.putAll(suppliedInputs);
        return inputs;
    }

    private boolean shouldSkip(String nodeId, List<JsonNode> edges, Map<String, String> branches) {
        boolean hasIncoming = false;
        for (JsonNode edge : edges) {
            if (!nodeId.equals(edge.path("target").asText())) {
                continue;
            }
            hasIncoming = true;
            String source = edge.path("source").asText();
            String handle = normalizeHandle(edge.path("sourceHandle").asText(""), source);
            // A target is skipped only when every incoming edge was ruled out by a branch.
            if (!branches.containsKey(source) || (!"true".equals(handle) && !"false".equals(handle))
                    || branches.get(source).equals(handle)) {
                return false;
            }
        }
        return hasIncoming;
    }

    private boolean evaluateCondition(String expression, Map<String, Object> inputs, JsonNode data) {
        if (data.has("condition") && data.get("condition").isBoolean()) {
            return data.get("condition").asBoolean();
        }
        String normalized = expression.trim();
        if ("true".equalsIgnoreCase(normalized)) return true;
        if ("false".equalsIgnoreCase(normalized)) return false;

        Matcher matcher = COMPARISON.matcher(normalized);
        if (matcher.matches()) {
            Object left = findInputValue(matcher.group(1), inputs);
            String rightText = matcher.group(3).replaceAll("^['\"]|['\"]$", "");
            Double leftNumber = asNumber(left);
            Double rightNumber = asNumber(rightText);
            if (leftNumber != null && rightNumber != null) {
                return compare(leftNumber, rightNumber, matcher.group(2));
            }
            String leftText = String.valueOf(left);
            return switch (matcher.group(2)) {
                case "==" -> leftText.equals(rightText);
                case "!=" -> !leftText.equals(rightText);
                case ">" -> leftText.compareTo(rightText) > 0;
                case "<" -> leftText.compareTo(rightText) < 0;
                case ">=" -> leftText.compareTo(rightText) >= 0;
                case "<=" -> leftText.compareTo(rightText) <= 0;
                default -> false;
            };
        }
        Object value = firstValue(inputs);
        return value instanceof Boolean bool ? bool : value != null && !value.toString().isBlank();
    }

    private boolean compare(double left, double right, String operator) {
        return switch (operator) {
            case ">" -> left > right;
            case "<" -> left < right;
            case ">=" -> left >= right;
            case "<=" -> left <= right;
            case "==" -> left == right;
            case "!=" -> left != right;
            default -> false;
        };
    }

    private Double asNumber(Object value) {
        if (value instanceof Number number) return number.doubleValue();
        if (value == null) return null;
        try {
            return Double.parseDouble(value.toString().trim());
        } catch (NumberFormatException ignored) {
            return null;
        }
    }

    private Object findInputValue(String name, Map<String, Object> inputs) {
        Object found = inputs.get(name);
        if (found instanceof Map<?, ?> map && map.containsKey("value")) {
            return map.get("value");
        }
        return found == null ? firstValue(inputs) : found;
    }

    private Object firstValue(Map<String, Object> inputs) {
        if (inputs.isEmpty()) return null;
        Object first = inputs.values().iterator().next();
        if (first instanceof Map<?, ?> map) {
            return map.containsKey("text") ? map.get("text") : map.get("value");
        }
        return first;
    }

    private String interpolate(String template, Map<String, Object> inputs) {
        String result = template;
        Matcher matcher = Pattern.compile("\\{\\{\\s*([\\w.-]+)\\s*}}").matcher(template);
        while (matcher.find()) {
            Object value = findInputValue(matcher.group(1), inputs);
            result = result.replace(matcher.group(), value == null ? "" : value.toString());
        }
        return result;
    }

    private String writeJson(Object value) {
        try {
            return mapper.writeValueAsString(value);
        } catch (JsonProcessingException exception) {
            throw new IllegalStateException("Could not serialize execution data", exception);
        }
    }

    private String legacyResult(Map<String, Object> output) {
        Object value = output.containsKey("text") ? output.get("text") : output.get("value");
        if (value != null) return value.toString();
        return output.toString();
    }

    private String normalizeHandle(String handle, String nodeId) {
        String prefix = nodeId + "-";
        return handle.startsWith(prefix) ? handle.substring(prefix.length()) : handle;
    }
}
