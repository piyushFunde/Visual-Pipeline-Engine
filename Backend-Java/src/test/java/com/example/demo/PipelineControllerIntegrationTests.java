package com.example.demo;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.client.TestRestTemplate;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;

import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
class PipelineControllerIntegrationTests {

    @LocalServerPort
    private int port;

    @Autowired
    private TestRestTemplate restTemplate;

    @Test
    void executePipelineReturnsExecutionLogs() {
        String pipelineJson = "{\"nodes\":[{\"id\":\"text-1\",\"type\":\"text\",\"position\":{\"x\":100,\"y\":100},\"data\":{\"text\":\"Hello\"}},{\"id\":\"llm-1\",\"type\":\"llm\",\"position\":{\"x\":300,\"y\":100},\"data\":{}}],\"edges\":[{\"id\":\"e1\",\"source\":\"text-1\",\"target\":\"llm-1\"}]}";

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_FORM_URLENCODED);
        String body = "pipeline=" + pipelineJson;

        HttpEntity<String> request = new HttpEntity<>(body, headers);
        ResponseEntity<Map> response = restTemplate.postForEntity("http://localhost:" + port + "/pipelines/execute", request, Map.class);

        assertThat(response.getStatusCode().is2xxSuccessful()).isTrue();
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().get("status")).isEqualTo("success");

        Object logs = response.getBody().get("logs");
        assertThat(logs).isInstanceOfAny(java.util.List.class);
        assertThat(((java.util.List<?>) logs)).hasSize(2);
    }
}
