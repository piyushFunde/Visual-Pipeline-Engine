package com.example.demo;

import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/templates")
public class TemplateController {

    private static final List<Map<String, Object>> TEMPLATES = List.of(
        Map.of(
            "id", "tpl-1",
            "name", "Customer Ticket Triage",
            "description", "Classify support tickets and route urgent ones to Slack.",
            "tags", List.of("support", "llm", "condition"),
            "nodes", """
                [{"id":"customInput-1","type":"customInput","position":{"x":60,"y":180},"data":{"id":"customInput-1","nodeType":"customInput","inputName":"ticket","inputType":"Text"}},
                 {"id":"text-1","type":"text","position":{"x":260,"y":180},"data":{"id":"text-1","nodeType":"text","text":"Parse ticket: {{ticket}}"}},
                 {"id":"llm-1","type":"llm","position":{"x":460,"y":180},"data":{"id":"llm-1","nodeType":"llm","prompt":"Classify this support ticket as URGENT or STANDARD: {{text-1}}"}},
                 {"id":"condition-1","type":"condition","position":{"x":660,"y":180},"data":{"id":"condition-1","nodeType":"condition","expression":"llm-1 == URGENT"}},
                 {"id":"api-1","type":"api","position":{"x":860,"y":100},"data":{"id":"api-1","nodeType":"api","url":"https://slack.com/api/chat.postMessage","method":"POST"}},
                 {"id":"customOutput-1","type":"customOutput","position":{"x":860,"y":280},"data":{"id":"customOutput-1","nodeType":"customOutput","outputName":"result","outputType":"Text"}}]
                """,
            "edges", """
                [{"id":"e1","source":"customInput-1","target":"text-1","type":"pipeline"},
                 {"id":"e2","source":"text-1","target":"llm-1","type":"pipeline"},
                 {"id":"e3","source":"llm-1","target":"condition-1","type":"pipeline"},
                 {"id":"e4","source":"condition-1","sourceHandle":"condition-1-true","target":"api-1","type":"pipeline"},
                 {"id":"e5","source":"condition-1","sourceHandle":"condition-1-false","target":"customOutput-1","type":"pipeline"}]
                """
        ),
        Map.of(
            "id", "tpl-2",
            "name", "Lead Enrichment & Cold Email",
            "description", "Format lead data and generate a personalized cold email.",
            "tags", List.of("sales", "llm", "email"),
            "nodes", """
                [{"id":"customInput-1","type":"customInput","position":{"x":60,"y":180},"data":{"id":"customInput-1","nodeType":"customInput","inputName":"lead","inputType":"Text"}},
                 {"id":"text-1","type":"text","position":{"x":260,"y":180},"data":{"id":"text-1","nodeType":"text","text":"Lead info: {{lead}}"}},
                 {"id":"llm-1","type":"llm","position":{"x":460,"y":180},"data":{"id":"llm-1","nodeType":"llm","prompt":"Write a personalized cold email for this lead: {{text-1}}"}},
                 {"id":"customOutput-1","type":"customOutput","position":{"x":660,"y":180},"data":{"id":"customOutput-1","nodeType":"customOutput","outputName":"email","outputType":"Text"}}]
                """,
            "edges", """
                [{"id":"e1","source":"customInput-1","target":"text-1","type":"pipeline"},
                 {"id":"e2","source":"text-1","target":"llm-1","type":"pipeline"},
                 {"id":"e3","source":"llm-1","target":"customOutput-1","type":"pipeline"}]
                """
        ),
        Map.of(
            "id", "tpl-3",
            "name", "Multi-Language Translator",
            "description", "Detect language and translate text using an LLM.",
            "tags", List.of("translation", "llm", "condition"),
            "nodes", """
                [{"id":"customInput-1","type":"customInput","position":{"x":60,"y":180},"data":{"id":"customInput-1","nodeType":"customInput","inputName":"text","inputType":"Text"}},
                 {"id":"condition-1","type":"condition","position":{"x":260,"y":180},"data":{"id":"condition-1","nodeType":"condition","expression":"text != ''"}},
                 {"id":"llm-1","type":"llm","position":{"x":460,"y":120},"data":{"id":"llm-1","nodeType":"llm","prompt":"Translate the following text to English: {{text}}"}},
                 {"id":"customOutput-1","type":"customOutput","position":{"x":660,"y":180},"data":{"id":"customOutput-1","nodeType":"customOutput","outputName":"translation","outputType":"Text"}}]
                """,
            "edges", """
                [{"id":"e1","source":"customInput-1","target":"condition-1","type":"pipeline"},
                 {"id":"e2","source":"condition-1","sourceHandle":"condition-1-true","target":"llm-1","type":"pipeline"},
                 {"id":"e3","source":"llm-1","target":"customOutput-1","type":"pipeline"}]
                """
        ),
        Map.of(
            "id", "tpl-4",
            "name", "Data Validation & DB Sync",
            "description", "Validate incoming webhook data and sync to database.",
            "tags", List.of("database", "webhook", "validation"),
            "nodes", """
                [{"id":"webhook-1","type":"webhook","position":{"x":60,"y":180},"data":{"id":"webhook-1","nodeType":"webhook","url":"/webhook/data"}},
                 {"id":"condition-1","type":"condition","position":{"x":260,"y":180},"data":{"id":"condition-1","nodeType":"condition","expression":"webhook-1 != ''"}},
                 {"id":"database-1","type":"database","position":{"x":460,"y":120},"data":{"id":"database-1","nodeType":"database","query":"INSERT INTO records VALUES (?)"}},
                 {"id":"api-1","type":"api","position":{"x":660,"y":180},"data":{"id":"api-1","nodeType":"api","url":"https://api.example.com/response","method":"POST"}}]
                """,
            "edges", """
                [{"id":"e1","source":"webhook-1","target":"condition-1","type":"pipeline"},
                 {"id":"e2","source":"condition-1","sourceHandle":"condition-1-true","target":"database-1","type":"pipeline"},
                 {"id":"e3","source":"database-1","target":"api-1","type":"pipeline"}]
                """
        )
    );

    @GetMapping
    public List<Map<String, Object>> getTemplates() {
        return TEMPLATES;
    }

    @GetMapping("/{id}")
    public Map<String, Object> getTemplate(@PathVariable("id") String id) {
        return TEMPLATES.stream()
            .filter(t -> id.equals(t.get("id")))
            .findFirst()
            .orElseThrow(() -> new ResourceNotFoundException("Template not found: " + id));
    }
}
