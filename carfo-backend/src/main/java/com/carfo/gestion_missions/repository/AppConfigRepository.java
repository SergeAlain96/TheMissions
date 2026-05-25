package com.carfo.gestion_missions.repository;

import com.carfo.gestion_missions.entity.AppConfig;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface AppConfigRepository extends JpaRepository<AppConfig, Long> {
}
