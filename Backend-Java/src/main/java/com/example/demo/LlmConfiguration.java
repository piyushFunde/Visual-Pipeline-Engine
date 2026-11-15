package com.example.demo;

import org.springframework.boot.autoconfigure.condition.ConditionalOnMissingBean;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class LlmConfiguration {
    @Bean
    @ConditionalOnMissingBean(LlmClient.class)
    public LlmClient simulatedLlmClient() {
        return new SimulatedLlmClient();
    }
}
