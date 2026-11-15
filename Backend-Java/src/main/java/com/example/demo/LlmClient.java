package com.example.demo;

import java.util.Map;

public interface LlmClient {
    LlmResponse generate(String prompt, Map<String, Object> inputs);

    record LlmResponse(String text, Integer tokens, boolean simulated) {
    }
}
