package com.example.demo;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.node.ArrayNode;

import java.util.ArrayDeque;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Queue;
import java.util.Set;

final class ValidationRules {
    private ValidationRules() {
    }

    static List<ValidationRule> all() {
        return List.of(new CycleRule(), new UnconnectedNodeRule(), new DeadEndRule(),
                new UnreachableFromInputRule(), new MissingTemplateInputRule(), new LlmNoMaxTokensRule(),
                new DefaultNodeNameRule(), new ConditionMissingBranchRule(), new NoInputNodeRule(),
                new NoOutputNodeRule());
    }

    static ApiDtos.IssueResponse issue(String code, String severity, String nodeId, String title,
                                       String detail, ApiDtos.FixDescriptor fix) {
        String identity = code.toLowerCase() + "-" + (nodeId == null ? "pipeline" : nodeId)
                + "-" + Integer.toHexString((title + detail).hashCode());
        return new ApiDtos.IssueResponse(identity,
                severity, code, nodeId, title, detail, fix);
    }

    static String type(JsonNode node) {
        return node.path("type").asText("");
    }

    static boolean output(JsonNode node) {
        return "customOutput".equals(type(node)) || "output".equals(type(node));
    }

    static boolean input(JsonNode node) {
        return "customInput".equals(type(node)) || "input".equals(type(node));
    }

    static String handle(JsonNode edge, String name) {
        String value = edge.path(name).asText("");
        String nodeId = edge.path(name.startsWith("source") ? "source" : "target").asText("");
        String prefix = nodeId + "-";
        return value.startsWith(prefix) ? value.substring(prefix.length()) : value;
    }

    static List<JsonNode> array(JsonNode node) {
        List<JsonNode> result = new ArrayList<>();
        if (node instanceof ArrayNode array) array.forEach(result::add);
        return result;
    }

    static ApiDtos.FixDescriptor addEdge(String label, String source, String target, String handle) {
        Map<String, Object> op = new HashMap<>();
        op.put("type", "addEdge");
        op.put("source", source);
        op.put("target", target);
        if (handle != null) op.put("sourceHandle", handle);
        return new ApiDtos.FixDescriptor(label, List.of(op));
    }
}

final class CycleRule implements ValidationRule {
    @Override public List<ApiDtos.IssueResponse> validate(JsonNode nodes, JsonNode edges) {
        Map<String, List<String>> adjacency = new HashMap<>();
        Map<String, Integer> indegree = new HashMap<>();
        for (JsonNode node : ValidationRules.array(nodes)) {
            String id = node.path("id").asText();
            adjacency.put(id, new ArrayList<>());
            indegree.put(id, 0);
        }
        for (JsonNode edge : ValidationRules.array(edges)) {
            String source = edge.path("source").asText();
            String target = edge.path("target").asText();
            if (adjacency.containsKey(source) && indegree.containsKey(target)) {
                adjacency.get(source).add(target);
                indegree.put(target, indegree.get(target) + 1);
            }
        }
        Queue<String> queue = new ArrayDeque<>();
        indegree.forEach((id, count) -> { if (count == 0) queue.add(id); });
        int visited = 0;
        while (!queue.isEmpty()) {
            String id = queue.remove();
            visited++;
            for (String target : adjacency.get(id)) {
                int next = indegree.compute(target, (key, value) -> value - 1);
                if (next == 0) queue.add(target);
            }
        }
        if (visited == indegree.size()) return List.of();
        return List.of(ValidationRules.issue("CYCLE", "ERROR", null, "Pipeline contains a cycle",
                "The graph cannot be executed in topological order until the cycle is removed.", null));
    }
}

final class UnconnectedNodeRule implements ValidationRule {
    @Override public List<ApiDtos.IssueResponse> validate(JsonNode nodes, JsonNode edges) {
        List<ApiDtos.IssueResponse> issues = new ArrayList<>();
        for (JsonNode node : ValidationRules.array(nodes)) {
            String id = node.path("id").asText();
            boolean connected = ValidationRules.array(edges).stream().anyMatch(edge ->
                    id.equals(edge.path("source").asText()) || id.equals(edge.path("target").asText()));
            if (!connected) issues.add(ValidationRules.issue("UNCONNECTED_NODE", "WARNING", id,
                    "Node is not connected", "Connect this node to the rest of the flow.", null));
        }
        return issues;
    }
}

final class DeadEndRule implements ValidationRule {
    @Override public List<ApiDtos.IssueResponse> validate(JsonNode nodes, JsonNode edges) {
        List<JsonNode> nodeList = ValidationRules.array(nodes);
        JsonNode outputNode = nodeList.stream().filter(ValidationRules::output).findFirst().orElse(null);
        List<ApiDtos.IssueResponse> issues = new ArrayList<>();
        for (JsonNode node : nodeList) {
            if (ValidationRules.output(node)) continue;
            String id = node.path("id").asText();
            boolean hasOutgoing = ValidationRules.array(edges).stream().anyMatch(edge ->
                    id.equals(edge.path("source").asText()));
            if (!hasOutgoing) {
                String sourceHandle = switch (ValidationRules.type(node)) {
                    case "condition" -> findUnconnectedBranch(id, edges);
                    case "llm" -> "response";
                    case "timer" -> "done";
                    case "api" -> "response";
                    case "database" -> "result";
                    case "webhook" -> "payload";
                    default -> "output";
                };
                ApiDtos.FixDescriptor fix = outputNode == null ? null : ValidationRules.addEdge(
                        "Connect to Output", id, outputNode.path("id").asText(), sourceHandle);
                issues.add(ValidationRules.issue("DEAD_END", "WARNING", id, "Node has no outgoing connection",
                        "This node cannot pass its result to a later step.", fix));
            }
        }
        return issues;
    }

    private String findUnconnectedBranch(String nodeId, JsonNode edges) {
        Set<String> branches = new HashSet<>();
        for (JsonNode edge : ValidationRules.array(edges)) {
            if (nodeId.equals(edge.path("source").asText())) branches.add(ValidationRules.handle(edge, "sourceHandle"));
        }
        return branches.contains("true") ? "false" : "true";
    }
}

final class UnreachableFromInputRule implements ValidationRule {
    @Override public List<ApiDtos.IssueResponse> validate(JsonNode nodes, JsonNode edges) {
        Map<String, List<String>> adjacency = new HashMap<>();
        Queue<String> queue = new ArrayDeque<>();
        Set<String> reachable = new HashSet<>();
        for (JsonNode node : ValidationRules.array(nodes)) {
            String id = node.path("id").asText();
            adjacency.put(id, new ArrayList<>());
            if (ValidationRules.input(node)) queue.add(id);
        }
        for (JsonNode edge : ValidationRules.array(edges)) {
            if (adjacency.containsKey(edge.path("source").asText())) {
                adjacency.get(edge.path("source").asText()).add(edge.path("target").asText());
            }
        }
        while (!queue.isEmpty()) {
            String id = queue.remove();
            if (reachable.add(id)) queue.addAll(adjacency.getOrDefault(id, List.of()));
        }
        List<ApiDtos.IssueResponse> issues = new ArrayList<>();
        for (JsonNode node : ValidationRules.array(nodes)) {
            String id = node.path("id").asText();
            if (!reachable.contains(id)) issues.add(ValidationRules.issue("UNREACHABLE_FROM_INPUT", "WARNING", id,
                    "Node is unreachable from an Input", "No path from an Input node reaches this node.", null));
        }
        return issues;
    }
}

final class MissingTemplateInputRule implements ValidationRule {
    @Override public List<ApiDtos.IssueResponse> validate(JsonNode nodes, JsonNode edges) {
        List<ApiDtos.IssueResponse> issues = new ArrayList<>();
        for (JsonNode node : ValidationRules.array(nodes)) {
            String type = ValidationRules.type(node);
            if (!"text".equals(type) && !"llm".equals(type)) continue;
            String key = "llm".equals(type) ? "prompt" : "text";
            String prompt = node.path("data").path(key).asText("");
            var matcher = java.util.regex.Pattern.compile("\\{\\{\\s*([\\w.-]+)\\s*}}").matcher(prompt);
            while (matcher.find()) {
                String variable = matcher.group(1);
                boolean provided = ValidationRules.array(edges).stream().anyMatch(edge ->
                        node.path("id").asText().equals(edge.path("target").asText())
                                && variable.equals(ValidationRules.handle(edge, "targetHandle")));
                if (provided) continue;

                String nearestText = nearestUpstreamText(node.path("id").asText(), nodes, edges);
                ApiDtos.FixDescriptor fix = nearestText == null ? null : ValidationRules.addEdge(
                        "Map to Text output", nearestText, node.path("id").asText(), "output");
                issues.add(ValidationRules.issue("MISSING_TEMPLATE_INPUT", "WARNING", node.path("id").asText(),
                        "Template input is not provided", "Prompt variable {{" + variable
                                + "}} has no upstream connection.", fix));
            }
        }
        return issues;
    }

    private String nearestUpstreamText(String target, JsonNode nodes, JsonNode edges) {
        Map<String, JsonNode> nodeById = new HashMap<>();
        for (JsonNode node : ValidationRules.array(nodes)) nodeById.put(node.path("id").asText(), node);
        Queue<String> queue = new ArrayDeque<>();
        Set<String> seen = new HashSet<>();
        queue.add(target);
        while (!queue.isEmpty()) {
            String current = queue.remove();
            for (JsonNode edge : ValidationRules.array(edges)) {
                if (current.equals(edge.path("target").asText())) {
                    String source = edge.path("source").asText();
                    if (seen.add(source)) {
                        JsonNode candidate = nodeById.get(source);
                        if (candidate != null && "text".equals(ValidationRules.type(candidate))) return source;
                        queue.add(source);
                    }
                }
            }
        }
        return null;
    }
}

final class LlmNoMaxTokensRule implements ValidationRule {
    @Override public List<ApiDtos.IssueResponse> validate(JsonNode nodes, JsonNode edges) {
        List<ApiDtos.IssueResponse> issues = new ArrayList<>();
        for (JsonNode node : ValidationRules.array(nodes)) {
            if (!"llm".equals(ValidationRules.type(node)) || node.path("data").has("maxTokens")) continue;
            Map<String, Object> op = Map.of("type", "setNodeData", "nodeId", node.path("id").asText(),
                    "key", "maxTokens", "value", 400);
            issues.add(ValidationRules.issue("LLM_NO_MAX_TOKENS", "WARNING", node.path("id").asText(),
                    "No max-token limit set", "Set a limit to keep generated responses bounded.",
                    new ApiDtos.FixDescriptor("Set max tokens to 400", List.of(op))));
        }
        return issues;
    }
}

final class DefaultNodeNameRule implements ValidationRule {
    @Override public List<ApiDtos.IssueResponse> validate(JsonNode nodes, JsonNode edges) {
        List<ApiDtos.IssueResponse> issues = new ArrayList<>();
        for (JsonNode node : ValidationRules.array(nodes)) {
            JsonNode data = node.path("data");
            String type = ValidationRules.type(node);
            String nameKey = "customInput".equals(type) || "input".equals(type) ? "inputName"
                    : "customOutput".equals(type) || "output".equals(type) ? "outputName" : "name";
            String name = data.path(nameKey).asText("");
            if (name.matches("(input|output|text|llm|condition|timer|api|database|webhook)_\\d+")) {
                String readable = name.replace('_', ' ').replaceAll("\\d+$", "").trim();
                Map<String, Object> op = Map.of("type", "renameNode", "nodeId", node.path("id").asText(),
                        "name", readable);
                issues.add(ValidationRules.issue("DEFAULT_NODE_NAME", "INFO", node.path("id").asText(),
                        "Node has a default name", "Give this node a descriptive name for easier reading.",
                        new ApiDtos.FixDescriptor("Rename to " + readable, List.of(op))));
            }
        }
        return issues;
    }
}

final class ConditionMissingBranchRule implements ValidationRule {
    @Override public List<ApiDtos.IssueResponse> validate(JsonNode nodes, JsonNode edges) {
        List<ApiDtos.IssueResponse> issues = new ArrayList<>();
        for (JsonNode node : ValidationRules.array(nodes)) {
            if (!"condition".equals(ValidationRules.type(node))) continue;
            Set<String> handles = new HashSet<>();
            for (JsonNode edge : ValidationRules.array(edges)) {
                if (node.path("id").asText().equals(edge.path("source").asText())) {
                    handles.add(ValidationRules.handle(edge, "sourceHandle"));
                }
            }
            if (!handles.contains("true") || !handles.contains("false")) {
                issues.add(ValidationRules.issue("CONDITION_MISSING_BRANCH", "WARNING", node.path("id").asText(),
                        "Condition branch is not connected", "Connect both the true and false paths.", null));
            }
        }
        return issues;
    }
}

final class NoInputNodeRule implements ValidationRule {
    @Override public List<ApiDtos.IssueResponse> validate(JsonNode nodes, JsonNode edges) {
        if (ValidationRules.array(nodes).stream().anyMatch(ValidationRules::input)) return List.of();
        return List.of(ValidationRules.issue("NO_INPUT_NODE", "ERROR", null, "No Input node",
                "Add an Input node to provide the flow with starting data.", null));
    }
}

final class NoOutputNodeRule implements ValidationRule {
    @Override public List<ApiDtos.IssueResponse> validate(JsonNode nodes, JsonNode edges) {
        if (ValidationRules.array(nodes).stream().anyMatch(ValidationRules::output)) return List.of();
        return List.of(ValidationRules.issue("NO_OUTPUT_NODE", "WARNING", null, "No Output node",
                "Add an Output node to make the final result visible.", null));
    }
}
