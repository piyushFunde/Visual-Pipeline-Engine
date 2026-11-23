package com.example.demo;

import jakarta.persistence.*;

@Entity
public class PipelineEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Long accountId;
    
    @Column(columnDefinition = "TEXT")
    private String nodesJson;
    
    @Column(columnDefinition = "TEXT")
    private String edgesJson;
    
    public PipelineEntity() {}

    public PipelineEntity(String nodesJson, String edgesJson) {
        this(null, nodesJson, edgesJson);
    }

    public PipelineEntity(Long accountId, String nodesJson, String edgesJson) {
        this.accountId = accountId;
        this.nodesJson = nodesJson;
        this.edgesJson = edgesJson;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Long getAccountId() { return accountId; }
    public void setAccountId(Long accountId) { this.accountId = accountId; }
    
    public String getNodesJson() { return nodesJson; }
    public void setNodesJson(String nodesJson) { this.nodesJson = nodesJson; }
    
    public String getEdgesJson() { return edgesJson; }
    public void setEdgesJson(String edgesJson) { this.edgesJson = edgesJson; }
}
