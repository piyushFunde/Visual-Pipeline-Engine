package com.example.demo;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.stereotype.Service;

import java.util.*;

@Service
public class DagValidationService {

    private final ObjectMapper mapper = new ObjectMapper();

    public Map<String, Object> parseAndValidate(String pipelineJson) {
        try {
            JsonNode root = mapper.readTree(pipelineJson);
            JsonNode nodesNode = root.get("nodes");
            JsonNode edgesNode = root.get("edges");
            
            int numNodes = 0;
            Set<String> nodeIds = new HashSet<>();
            
            if (nodesNode != null && nodesNode.isArray()) {
                numNodes = nodesNode.size();
                for (JsonNode n : nodesNode) {
                    if (n.has("id")) {
                        nodeIds.add(n.get("id").asText());
                    }
                }
            }
            
            int numEdges = 0;
            if (edgesNode != null && edgesNode.isArray()) {
                numEdges = edgesNode.size();
            }

            Map<String, List<String>> adjacency = new HashMap<>();
            Map<String, Integer> indegree = new HashMap<>();
            for (String id : nodeIds) {
                adjacency.put(id, new ArrayList<>());
                indegree.put(id, 0);
            }

            boolean hasInvalidEdge = false;

            if (edgesNode != null && edgesNode.isArray()) {
                for (JsonNode edge : edgesNode) {
                    String source = edge.has("source") ? edge.get("source").asText() : null;
                    String target = edge.has("target") ? edge.get("target").asText() : null;

                    if (source == null || target == null || !nodeIds.contains(source) || !nodeIds.contains(target)) {
                        hasInvalidEdge = true;
                        continue;
                    }

                    adjacency.get(source).add(target);
                    indegree.put(target, indegree.get(target) + 1);
                }
            }

            Queue<String> queue = new LinkedList<>();
            for (Map.Entry<String, Integer> entry : indegree.entrySet()) {
                if (entry.getValue() == 0) {
                    queue.offer(entry.getKey());
                }
            }

            int visitedCount = 0;
            List<String> executionOrder = new ArrayList<>();
            
            while (!queue.isEmpty()) {
                String current = queue.poll();
                visitedCount++;
                executionOrder.add(current);

                for (String neighbor : adjacency.get(current)) {
                    indegree.put(neighbor, indegree.get(neighbor) - 1);
                    if (indegree.get(neighbor) == 0) {
                        queue.offer(neighbor);
                    }
                }
            }

            boolean isDag = !hasInvalidEdge && (visitedCount == nodeIds.size());
            
            Map<String, Object> result = new HashMap<>();
            result.put("num_nodes", numNodes);
            result.put("num_edges", numEdges);
            result.put("is_dag", isDag);
            if (isDag) {
                result.put("execution_order", executionOrder);
            }
            return result;

        } catch (Exception e) {
            Map<String, Object> error = new HashMap<>();
            error.put("error", "Invalid JSON format in pipeline field");
            return error;
        }
    }
}
