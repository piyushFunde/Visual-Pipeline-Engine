package com.example.demo;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PipelineRepository extends JpaRepository<PipelineEntity, Long> {
    List<PipelineEntity> findByAccountId(Long accountId);
}
