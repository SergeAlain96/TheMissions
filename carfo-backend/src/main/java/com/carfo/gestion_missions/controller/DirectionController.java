package com.carfo.gestion_missions.controller;

import com.carfo.gestion_missions.dto.DirectionDTO.Request;
import com.carfo.gestion_missions.entity.Direction;
import com.carfo.gestion_missions.service.DirectionService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/directions")
@RequiredArgsConstructor
public class DirectionController {

    private final DirectionService directionService;

    @GetMapping
    public ResponseEntity<List<Direction>> getAllDirections() {
        return ResponseEntity.ok(directionService.getAllDirections());
    }

    @GetMapping("/{id}")
    public ResponseEntity<Direction> getDirectionById(@PathVariable Long id) {
        return ResponseEntity.ok(directionService.getDirectionById(id));
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMINISTRATEUR')")
    public ResponseEntity<Direction> createDirection(@Valid @RequestBody Request request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(directionService.createDirection(request));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMINISTRATEUR')")
    public ResponseEntity<Direction> updateDirection(@PathVariable Long id, @Valid @RequestBody Request request) {
        return ResponseEntity.ok(directionService.updateDirection(id, request));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMINISTRATEUR')")
    public ResponseEntity<Void> deleteDirection(@PathVariable Long id) {
        directionService.deleteDirection(id);
        return ResponseEntity.noContent().build();
    }
}
