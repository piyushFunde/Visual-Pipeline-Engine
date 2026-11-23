package com.example.demo;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
class PipelineFeatureMockMvcTests {
    @Autowired private MockMvc mockMvc;
    @Autowired private ObjectMapper mapper;

    @Test
    void executionRecordsInputsOutputsAndSkippedConditionBranch() throws Exception {
        String graph = """
                {"nodes":[
                  {"id":"input","type":"customInput","data":{"inputName":"request"}},
                  {"id":"condition","type":"condition","data":{"condition":true}},
                  {"id":"true-text","type":"text","data":{"text":"selected"}},
                  {"id":"false-text","type":"text","data":{"text":"not selected"}},
                  {"id":"output","type":"customOutput","data":{}}
                ],"edges":[
                  {"id":"a","source":"input","target":"condition"},
                  {"id":"b","source":"condition","sourceHandle":"true","target":"true-text"},
                  {"id":"c","source":"condition","sourceHandle":"false","target":"false-text"},
                  {"id":"d","source":"true-text","target":"output"},
                  {"id":"e","source":"false-text","target":"output"}
                ]}
                """;
        JsonNode response = mapper.readTree(mockMvc.perform(post("/pipelines/execute")
                        .contentType(MediaType.APPLICATION_FORM_URLENCODED)
                        .param("pipeline", graph))
                .andExpect(status().isOk()).andReturn().getResponse().getContentAsString());
        long runId = response.path("runId").asLong();
        assertThat(runId).isPositive();

        JsonNode run = mapper.readTree(mockMvc.perform(get("/runs/{id}", runId))
                .andExpect(status().isOk()).andReturn().getResponse().getContentAsString());
        assertThat(run.path("steps").size()).isEqualTo(5);
        assertThat(run.path("steps").get(0).path("orderIndex").asInt()).isZero();
        assertThat(run.path("steps").findValuesAsText("status")).contains("SKIPPED");
        assertThat(run.path("steps").get(2).path("durationMs").asLong()).isGreaterThanOrEqualTo(0);
        assertThat(run.path("simulated").asBoolean()).isTrue();
    }

    @Test
    void transitiveConditionBranchSkippingCascadesDownstream() throws Exception {
        String graph = """
                {"nodes":[
                  {"id":"input","type":"customInput","data":{"inputName":"request"}},
                  {"id":"condition","type":"condition","data":{"condition":true}},
                  {"id":"true-step","type":"text","data":{"text":"active branch"}},
                  {"id":"false-step1","type":"text","data":{"text":"skipped 1"}},
                  {"id":"false-step2","type":"text","data":{"text":"skipped 2"}},
                  {"id":"false-step3","type":"text","data":{"text":"skipped 3"}},
                  {"id":"output","type":"customOutput","data":{}}
                ],"edges":[
                  {"id":"e1","source":"input","target":"condition"},
                  {"id":"e2","source":"condition","sourceHandle":"true","target":"true-step"},
                  {"id":"e3","source":"condition","sourceHandle":"false","target":"false-step1"},
                  {"id":"e4","source":"false-step1","target":"false-step2"},
                  {"id":"e5","source":"false-step2","target":"false-step3"},
                  {"id":"e6","source":"true-step","target":"output"},
                  {"id":"e7","source":"false-step3","target":"output"}
                ]}
                """;
        JsonNode response = mapper.readTree(mockMvc.perform(post("/pipelines/execute")
                        .contentType(MediaType.APPLICATION_FORM_URLENCODED)
                        .param("pipeline", graph))
                .andExpect(status().isOk()).andReturn().getResponse().getContentAsString());
        long runId = response.path("runId").asLong();

        JsonNode run = mapper.readTree(mockMvc.perform(get("/runs/{id}", runId))
                .andExpect(status().isOk()).andReturn().getResponse().getContentAsString());

        for (JsonNode step : run.path("steps")) {
            String nodeId = step.path("nodeId").asText();
            if (nodeId.startsWith("false-step")) {
                assertThat(step.path("status").asText())
                        .withFailMessage("Expected " + nodeId + " to be SKIPPED transitively")
                        .isEqualTo("SKIPPED");
            }
            if ("true-step".equals(nodeId) || "output".equals(nodeId) || "input".equals(nodeId)) {
                assertThat(step.path("status").asText()).isEqualTo("DONE");
            }
        }
    }

    @Test
    void validationReportsIssuesAndEstimateIsExplicitlyLabeled() throws Exception {
        String graph = """
                {"nodes":[
                  {"id":"in","type":"customInput","data":{"inputName":"input_0"}},
                  {"id":"llm","type":"llm","data":{"prompt":"{{customer}}"}},
                  {"id":"out","type":"customOutput","data":{}}
                ],"edges":[{"source":"in","target":"llm"},{"source":"llm","target":"out"}]}
                """;
        JsonNode validation = mapper.readTree(mockMvc.perform(post("/pipelines/validate")
                        .contentType(MediaType.APPLICATION_JSON).content(graph))
                .andExpect(status().isOk()).andReturn().getResponse().getContentAsString());
        assertThat(validation.path("score").asInt()).isBetween(0, 100);
        assertThat(validation.path("issues").findValuesAsText("code"))
                .contains("MISSING_TEMPLATE_INPUT", "LLM_NO_MAX_TOKENS", "DEFAULT_NODE_NAME");
        JsonNode tokenIssue = null;
        for (JsonNode issue : validation.path("issues")) {
            if ("LLM_NO_MAX_TOKENS".equals(issue.path("code").asText())) tokenIssue = issue;
        }
        assertThat(tokenIssue).isNotNull();
        assertThat(tokenIssue.path("fix").isObject()).isTrue();

        JsonNode estimate = mapper.readTree(mockMvc.perform(post("/pipelines/estimate")
                        .contentType(MediaType.APPLICATION_JSON).content(graph))
                .andExpect(status().isOk()).andReturn().getResponse().getContentAsString());
        assertThat(estimate.path("isEstimate").asBoolean()).isTrue();
        assertThat(estimate.path("method").asText()).contains("divided by four");
        assertThat(estimate.path("nodes").size()).isEqualTo(3);
    }

    @Test
    void validationDetectsCyclesAndDescribesDeadEndFixesWithoutChangingTheGraph() throws Exception {
        String cyclic = """
                {"nodes":[{"id":"in","type":"customInput","data":{}},
                  {"id":"out","type":"customOutput","data":{}}],
                 "edges":[{"source":"in","target":"out"},{"source":"out","target":"in"}]}
                """;
        JsonNode cycleResult = mapper.readTree(mockMvc.perform(post("/pipelines/validate")
                        .contentType(MediaType.APPLICATION_JSON).content(cyclic))
                .andExpect(status().isOk()).andReturn().getResponse().getContentAsString());
        assertThat(cycleResult.path("issues").findValuesAsText("code")).contains("CYCLE");

        String deadEnd = """
                {"nodes":[{"id":"in","type":"customInput","data":{}},
                  {"id":"out","type":"customOutput","data":{}}],"edges":[]}
                """;
        JsonNode deadEndResult = mapper.readTree(mockMvc.perform(post("/pipelines/validate")
                        .contentType(MediaType.APPLICATION_JSON).content(deadEnd))
                .andExpect(status().isOk()).andReturn().getResponse().getContentAsString());
        JsonNode deadEndIssue = null;
        for (JsonNode issue : deadEndResult.path("issues")) {
            if ("DEAD_END".equals(issue.path("code").asText())) deadEndIssue = issue;
        }
        assertThat(deadEndIssue).isNotNull();
        assertThat(deadEndIssue.path("fix").path("ops").get(0).path("type").asText()).isEqualTo("addEdge");
        assertThat(deadEndIssue.path("fix").path("ops").get(0).path("source").asText()).isEqualTo("in");
        assertThat(deadEndIssue.path("fix").path("ops").get(0).path("target").asText()).isEqualTo("out");
    }

    @Test
    void testsCanBeCreatedExecutedAndReportExpectedAndActual() throws Exception {
        String graph = """
                {"nodes":[{"id":"in","type":"customInput","data":{}},
                  {"id":"out","type":"customOutput","data":{}}],
                 "edges":[{"source":"in","target":"out"}]}
                """;
        JsonNode saved = mapper.readTree(mockMvc.perform(post("/pipelines/save")
                        .contentType(MediaType.APPLICATION_FORM_URLENCODED).param("pipeline", graph))
                .andExpect(status().isOk()).andReturn().getResponse().getContentAsString());
        long pipelineId = saved.path("id").asLong();
        String request = mapper.writeValueAsString(Map.of("name", "failing output",
                "inputs", Map.of(), "assertions", new Object[]{
                        Map.of("type", "outputEquals", "nodeId", "out", "expected", "wanted"),
                        Map.of("type", "noError")
                }));
        mockMvc.perform(post("/pipelines/{id}/tests", pipelineId)
                        .contentType(MediaType.APPLICATION_JSON).content(request))
                .andExpect(status().isOk());

        JsonNode results = mapper.readTree(mockMvc.perform(post("/pipelines/{id}/tests/run", pipelineId))
                .andExpect(status().isOk()).andReturn().getResponse().getContentAsString());
        JsonNode result = results.path("results").get(0);
        assertThat(result.path("passed").asBoolean()).isFalse();
        assertThat(result.path("failures").get(0).path("expected").asText()).isEqualTo("wanted");
        assertThat(result.path("failures").get(0).path("actual").asText()).isEmpty();
        JsonNode savedCases = mapper.readTree(mockMvc.perform(get("/pipelines/{id}/tests", pipelineId))
                .andExpect(status().isOk()).andReturn().getResponse().getContentAsString());
        assertThat(savedCases.get(0).path("latestResult").path("passed").asBoolean()).isFalse();
        assertThat(mapper.readTree(mockMvc.perform(get("/pipelines/{id}/runs", pipelineId))
                .andExpect(status().isOk()).andReturn().getResponse().getContentAsString()).size()).isEqualTo(1);
    }

    @Test
    void testCasesSupportReadUpdateDeleteAndCreationFromRecordedRuns() throws Exception {
        String graph = """
                {"nodes":[{"id":"in","type":"customInput","data":{}},
                  {"id":"out","type":"customOutput","data":{}}],
                 "edges":[{"source":"in","target":"out"}]}
                """;
        long pipelineId = mapper.readTree(mockMvc.perform(post("/pipelines/save")
                        .contentType(MediaType.APPLICATION_FORM_URLENCODED).param("pipeline", graph))
                .andExpect(status().isOk()).andReturn().getResponse().getContentAsString())
                .path("id").asLong();
        long runId = mapper.readTree(mockMvc.perform(post("/pipelines/execute")
                        .contentType(MediaType.APPLICATION_FORM_URLENCODED).param("pipeline", graph)
                        .param("pipelineId", Long.toString(pipelineId)))
                .andExpect(status().isOk()).andReturn().getResponse().getContentAsString())
                .path("runId").asLong();

        JsonNode fromRun = mapper.readTree(mockMvc.perform(post("/pipelines/{id}/tests/from-run/{runId}", pipelineId, runId))
                .andExpect(status().isOk()).andReturn().getResponse().getContentAsString());
        long testId = fromRun.path("id").asLong();
        assertThat(fromRun.path("assertions").size()).isGreaterThanOrEqualTo(2);
        assertThat(mapper.readTree(mockMvc.perform(get("/pipelines/{id}/tests", pipelineId))
                .andExpect(status().isOk()).andReturn().getResponse().getContentAsString()).size()).isEqualTo(1);

        String update = mapper.writeValueAsString(Map.of("name", "renamed", "inputs", Map.of(), "assertions", new Object[]{}));
        assertThat(mapper.readTree(mockMvc.perform(put("/pipelines/{id}/tests/{testId}", pipelineId, testId)
                        .contentType(MediaType.APPLICATION_JSON).content(update))
                .andExpect(status().isOk()).andReturn().getResponse().getContentAsString())
                .path("name").asText()).isEqualTo("renamed");

        mockMvc.perform(delete("/pipelines/{id}/tests/{testId}", pipelineId, testId))
                .andExpect(status().isOk());
        assertThat(mapper.readTree(mockMvc.perform(get("/pipelines/{id}/tests", pipelineId))
                .andExpect(status().isOk()).andReturn().getResponse().getContentAsString()).size()).isZero();
    }
}
