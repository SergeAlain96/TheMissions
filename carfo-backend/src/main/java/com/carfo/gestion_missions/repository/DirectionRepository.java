package com.carfo.gestion_missions.repository;

import com.carfo.gestion_missions.entity.Direction;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface DirectionRepository extends JpaRepository<Direction, Long> {
    Optional<Direction> findByNomDirection(String nomDirection);
    boolean existsByNomDirection(String nomDirection);
}
