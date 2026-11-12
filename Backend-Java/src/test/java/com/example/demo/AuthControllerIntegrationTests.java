package com.example.demo;

import java.util.Map;
import java.util.UUID;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.core.type.TypeReference;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockHttpSession;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
class AuthControllerIntegrationTests {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private AccountRepository accountRepository;

    @Autowired
    private ObjectMapper objectMapper;

    @Test
    void registerAndLoginCreateAnAuthenticatedSession() throws Exception {
        String email = "test-" + UUID.randomUUID() + "@example.com";
        String password = "correct-horse-battery";
        String name = "Test User";

        MvcResult registration = performPost("/auth/register", Map.of(
                "name", name, "email", email, "password", password, "marketingOptIn", true))
                .andExpect(status().isCreated())
                .andReturn();

        Map<String, Object> registrationBody = objectMapper.readValue(
                registration.getResponse().getContentAsString(), new TypeReference<>() {});
        assertThat(registrationBody).containsEntry("email", email);
        assertThat(registrationBody).containsEntry("name", name);
        assertThat(registrationBody).doesNotContainKey("password");
        AccountEntity storedAccount = accountRepository.findByEmail(email).orElseThrow();
        assertThat(storedAccount.getPasswordHash()).isNotEqualTo(password);

        performPost("/auth/login", Map.of("email", email, "password", "incorrect-password"))
                .andExpect(status().isUnauthorized());

        MvcResult login = performPost("/auth/login", Map.of("email", email.toUpperCase(), "password", password))
                .andExpect(status().isOk())
                .andReturn();
        MockHttpSession session = (MockHttpSession) login.getRequest().getSession(false);

        MvcResult currentAccount = mockMvc.perform(get("/auth/me").session(session))
                .andExpect(status().isOk())
                .andReturn();
        Map<String, Object> currentAccountBody = objectMapper.readValue(
                currentAccount.getResponse().getContentAsString(), new TypeReference<>() {});
        assertThat(currentAccountBody).containsEntry("email", email);
        assertThat(currentAccountBody).containsEntry("name", name);
    }

    @Test
    void registrationRejectsDuplicateEmailAndWeakPassword() throws Exception {
        String email = "duplicate-" + UUID.randomUUID() + "@example.com";
        performPost("/auth/register", Map.of(
                "name", "Duplicate User", "email", email, "password", "valid-password"))
                .andExpect(status().isCreated());

        performPost("/auth/register", Map.of(
                "name", "Duplicate User", "email", email.toUpperCase(), "password", "another-password"))
                .andExpect(status().isConflict());

        performPost("/auth/register", Map.of(
                "name", "Weak Password", "email", "weak-" + UUID.randomUUID() + "@example.com", "password", "short"))
                .andExpect(status().isBadRequest());

        performPost("/auth/register", Map.of(
                "email", "missing-name-" + UUID.randomUUID() + "@example.com", "password", "valid-password"))
                .andExpect(status().isBadRequest());
    }

    @Test
    void currentAccountRequiresAnAuthenticatedSession() throws Exception {
        mockMvc.perform(get("/auth/me"))
                .andExpect(status().isUnauthorized());
    }

    private org.springframework.test.web.servlet.ResultActions performPost(String path, Map<String, ?> body)
            throws Exception {
        return mockMvc.perform(post(path)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(body)));
    }
}
