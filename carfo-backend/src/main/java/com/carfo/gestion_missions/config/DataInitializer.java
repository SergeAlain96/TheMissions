package com.carfo.gestion_missions.config;

import com.carfo.gestion_missions.entity.Direction;
import com.carfo.gestion_missions.repository.DirectionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.Objects;

@Configuration
@RequiredArgsConstructor
public class DataInitializer {

    private final DirectionRepository directionRepository;

    @Bean
    public CommandLineRunner initDirections() {
        return args -> {
            if (directionRepository.count() == 0) {
                directionRepository.save(Objects.requireNonNull(Direction.builder().nomDirection("Direction Générale").sigleDirection("DG").build()));
                directionRepository.save(Objects.requireNonNull(Direction.builder().nomDirection("Direction Financière").sigleDirection("DF").build()));
                directionRepository.save(Objects.requireNonNull(Direction.builder().nomDirection("Direction des Ressources Humaines").sigleDirection("DRH").build()));
                directionRepository.save(Objects.requireNonNull(Direction.builder().nomDirection("Direction Technique").sigleDirection("DT").build()));
                directionRepository.save(Objects.requireNonNull(Direction.builder().nomDirection("Direction Informatique").sigleDirection("DI").build()));
            }
        };
    }
}
