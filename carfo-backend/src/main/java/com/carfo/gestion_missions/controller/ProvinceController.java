package com.carfo.gestion_missions.controller;

import com.carfo.gestion_missions.entity.Province;
import com.carfo.gestion_missions.repository.ProvinceRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Référentiel des provinces (lecture pour tous les profils, mutations Admin only).
 */
@RestController
@RequestMapping("/api/provinces")
@RequiredArgsConstructor
public class ProvinceController {

    private final ProvinceRepository repository;

    @GetMapping
    public ResponseEntity<List<Province>> list() {
        return ResponseEntity.ok(repository.findAll(Sort.by("nom")));
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMINISTRATEUR')")
    public ResponseEntity<Province> create(@RequestBody Province p) {
        return ResponseEntity.status(HttpStatus.CREATED).body(repository.save(p));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMINISTRATEUR')")
    public ResponseEntity<Province> update(@PathVariable Long id, @RequestBody Province p) {
        p.setIdProvince(id);
        return ResponseEntity.ok(repository.save(p));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMINISTRATEUR')")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        repository.deleteById(id);
        return ResponseEntity.noContent().build();
    }
}
