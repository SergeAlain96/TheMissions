package com.carfo.gestion_missions;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class GestionMissionsApplication {
    public static void main(String[] args) {
        SpringApplication.run(GestionMissionsApplication.class, args);
    }
}
