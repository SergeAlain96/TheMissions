package com.carfo.gestion_missions.repository;

import com.carfo.gestion_missions.entity.Participe;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ParticipeRepository extends JpaRepository<Participe, Long> {

    List<Participe> findByMissionIdMission(Long idMission);

    List<Participe> findByAgentIdAgent(Long idAgent);

    boolean existsByAgentIdAgentAndMissionIdMission(Long idAgent, Long idMission);

    void deleteByMissionIdMission(Long idMission);
}
