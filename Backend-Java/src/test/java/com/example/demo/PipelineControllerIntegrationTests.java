package com.example.demo;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.client.TestRestTemplate;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;

import java.util.List;
import java.util.Map;
import java.util.Objects;

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
        ResponseEntity<Map<String, Object>> response = restTemplate.exchange(
                "http://localhost:" + port + "/pipelines/execute",
                HttpMethod.POST,
                request,
                new ParameterizedTypeReference<>() {
                });

        assertThat(response.getStatusCode().is2xxSuccessful()).isTrue();
        Map<String, Object> responseBody = Objects.requireNonNull(response.getBody(), "Response body must not be null");
        assertThat(responseBody.get("status")).isEqualTo("success");

        Object logs = responseBody.get("logs");
        assertThat(logs).isInstanceOf(List.class);
        assertThat((List<?>) logs).hasSize(2);
    }
}
