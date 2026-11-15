package com.example.demo;

import java.util.Map;

public class SimulatedLlmClient implements LlmClient {
    @Override
    public LlmResponse generate(String prompt, Map<String, Object> inputs) {
        return new LlmResponse("Simulated response for: " + prompt, null, true);
    }
}
