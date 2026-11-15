package com.example.demo;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface RunRepository extends JpaRepository<RunEntity, Long> {
    List<RunEntity> findByPipelineIdOrderByStartedAtDesc(Long pipelineId);
}
