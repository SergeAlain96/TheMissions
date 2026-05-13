package com.carfo.gestion_missions.controller;

import com.carfo.gestion_missions.dto.AgentDTO.UpdateRequest;
import com.carfo.gestion_missions.entity.Agent;
import com.carfo.gestion_missions.service.AgentService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/agents")
@RequiredArgsConstructor
public class AgentController {

    private final AgentService agentService;

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMINISTRATEUR', 'CHARGE_ETUDE')")
    public ResponseEntity<List<Agent>> getAllAgents() {
        return ResponseEntity.ok(agentService.getAllAgents());
    }

    @GetMapping("/{id:\\d+}")
    @PreAuthorize("hasAnyRole('ADMINISTRATEUR', 'CHARGE_ETUDE')")
    public ResponseEntity<Agent> getAgentById(@PathVariable Long id) {
        return ResponseEntity.ok(agentService.getAgentById(id));
    }

    @GetMapping("/chauffeurs")
    @PreAuthorize("hasAnyRole('ADMINISTRATEUR', 'CHARGE_ETUDE')")
    public ResponseEntity<List<Agent>> getAllChauffeurs() {
        return ResponseEntity.ok(agentService.getAllChauffeurs());
    }

    @GetMapping("/disponibles")
    @PreAuthorize("hasAnyRole('ADMINISTRATEUR', 'CHARGE_ETUDE')")
    public ResponseEntity<List<Agent>> getAgentsDisponibles(@RequestParam LocalDate dateDebut,
                                                            @RequestParam LocalDate dateFin) {
        return ResponseEntity.ok(agentService.getAgentsDisponibles(dateDebut, dateFin));
    }

    @GetMapping("/direction/{idDirection:\\d+}")
    @PreAuthorize("hasAnyRole('ADMINISTRATEUR', 'CHARGE_ETUDE')")
    public ResponseEntity<List<Agent>> getAgentsByDirection(@PathVariable Long idDirection) {
        return ResponseEntity.ok(agentService.getAgentsByDirection(idDirection));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMINISTRATEUR')")
    public ResponseEntity<Agent> updateAgent(@PathVariable Long id, @Valid @RequestBody UpdateRequest request) {
        return ResponseEntity.ok(agentService.updateAgent(id, request));
    }

    @PatchMapping("/{id}/desactiver")
    @PreAuthorize("hasRole('ADMINISTRATEUR')")
    public ResponseEntity<Void> deactivateAgent(@PathVariable Long id) {
        agentService.deactivateAgent(id);
        return ResponseEntity.status(HttpStatus.NO_CONTENT).build();
    }
}
