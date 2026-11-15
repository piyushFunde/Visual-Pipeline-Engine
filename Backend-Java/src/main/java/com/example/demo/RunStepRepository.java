package com.example.demo;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface RunStepRepository extends JpaRepository<RunStepEntity, Long> {
    List<RunStepEntity> findByRunIdOrderByOrderIndexAsc(Long runId);
}
