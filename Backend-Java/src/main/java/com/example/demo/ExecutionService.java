package com.example.demo;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.stereotype.Service;

import java.util.*;

@Service
public class ExecutionService {

    private final ObjectMapper mapper = new ObjectMapper();

    public Map<String, Object> executePipeline(String pipelineJson, List<String> executionOrder) {
        Map<String, Object> response = new HashMap<>();
        List<Map<String, Object>> executionLog = new ArrayList<>();
        Map<String, String> state = new HashMap<>();

        try {
            JsonNode root = mapper.readTree(pipelineJson);
            JsonNode nodesNode = root.get("nodes");
            
            Map<String, JsonNode> nodeMap = new HashMap<>();
            if (nodesNode != null && nodesNode.isArray()) {
                for (JsonNode n : nodesNode) {
                    nodeMap.put(n.get("id").asText(), n);
                }
            }

            for (String nodeId : executionOrder) {
                JsonNode node = nodeMap.get(nodeId);
                if (node == null) continue;
                
                String type = node.path("type").asText();
                JsonNode data = node.path("data");
                
                String resultStr = "";
                
                switch (type) {
                    case "text":
                        resultStr = "Processed Text Block: " + data.path("text").asText("{{input}}");
                        state.put("latest_text", resultStr);
                        break;
                    case "customInput":
                        resultStr = "Awaiting raw input: " + data.path("inputType").asText("Text");
                        break;
                    case "llm":
                        String priorText = state.getOrDefault("latest_text", "No context provided");
                        resultStr = "Simulated OpenAI Response analyzing: [" + priorText + "]";
                        state.put("latest_text", resultStr);
                        break;
                    case "customOutput":
                        String res = state.getOrDefault("latest_text", "Empty Result");
                        resultStr = "Final Console Output: " + res;
                        break;
                    default:
                        resultStr = "Processed generic block: " + type;
                        break;
                }

                Map<String, Object> logEntry = new HashMap<>();
                logEntry.put("nodeId", nodeId);
                logEntry.put("type", type);
                logEntry.put("result", resultStr);
                executionLog.add(logEntry);
            }

            response.put("status", "success");
            response.put("logs", executionLog);

        } catch (Exception e) {
            response.put("status", "error");
            response.put("message", "Engine failure: " + e.getMessage());
        }
        
        return response;
    }
}
