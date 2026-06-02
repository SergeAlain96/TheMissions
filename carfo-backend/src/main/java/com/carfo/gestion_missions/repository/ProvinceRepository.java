package com.carfo.gestion_missions.repository;

import com.carfo.gestion_missions.entity.Province;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ProvinceRepository extends JpaRepository<Province, Long> {
    boolean existsByNom(String nom);
}
