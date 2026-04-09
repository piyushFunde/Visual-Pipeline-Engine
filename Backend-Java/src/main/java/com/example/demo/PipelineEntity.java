package com.example.demo;

import jakarta.persistence.*;

@Entity
public class PipelineEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(columnDefinition = "TEXT")
    private String nodesJson;
    
    @Column(columnDefinition = "TEXT")
    private String edgesJson;
    
    public PipelineEntity() {}

    public PipelineEntity(String nodesJson, String edgesJson) {
        this.nodesJson = nodesJson;
        this.edgesJson = edgesJson;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    
    public String getNodesJson() { return nodesJson; }
    public void setNodesJson(String nodesJson) { this.nodesJson = nodesJson; }
    
    public String getEdgesJson() { return edgesJson; }
    public void setEdgesJson(String edgesJson) { this.edgesJson = edgesJson; }
}
