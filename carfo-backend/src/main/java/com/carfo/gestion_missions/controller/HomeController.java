package com.carfo.gestion_missions.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
public class HomeController {

    @GetMapping("/")
    public ResponseEntity<Map<String, String>> home() {
        return ResponseEntity.ok(Map.of(
                "message", "API CARFO Gestion Missions opérationnelle",
                "login", "POST /api/auth/login",
                "register", "POST /api/auth/register"
        ));
    }
}
