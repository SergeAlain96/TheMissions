package com.carfo.gestion_missions.service;

import com.carfo.gestion_missions.dto.AgentDTO.UpdateRequest;
import com.carfo.gestion_missions.entity.Agent;
import com.carfo.gestion_missions.entity.Direction;
import com.carfo.gestion_missions.enums.RoleAgent;
import com.carfo.gestion_missions.exception.DuplicateResourceException;
import com.carfo.gestion_missions.exception.ResourceNotFoundException;
import com.carfo.gestion_missions.repository.AgentRepository;
import com.carfo.gestion_missions.repository.DirectionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Objects;

@Service
@RequiredArgsConstructor
public class AgentService {

    private final AgentRepository agentRepository;
    private final DirectionRepository directionRepository;
    private final PasswordEncoder passwordEncoder;

    public List<Agent> getAllAgents() {
        return agentRepository.findAll();
    }

    public Agent getAgentById(Long id) {
        return agentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Agent introuvable : " + id));
    }

    public List<Agent> getAllChauffeurs() {
        return agentRepository.findAllChauffeurs();
    }

    public List<Agent> getAgentsByDirection(Long idDirection) {
        return agentRepository.findByDirectionIdDirectionAndActifTrue(idDirection);
    }

    @Transactional
    public Agent updateAgent(Long id, UpdateRequest request) {
        Agent agent = getAgentById(id);

        if (!agent.getEmail().equalsIgnoreCase(request.getEmail())
                && agentRepository.existsByEmail(request.getEmail())) {
            throw new DuplicateResourceException("Email déjà utilisé : " + request.getEmail());
        }

        if (!agent.getMatricule().equalsIgnoreCase(request.getMatricule())
                && agentRepository.existsByMatricule(request.getMatricule())) {
            throw new DuplicateResourceException("Matricule déjà utilisé : " + request.getMatricule());
        }

        Direction direction = directionRepository.findById(Objects.requireNonNull(request.getIdDirection(), "idDirection est obligatoire"))
                .orElseThrow(() -> new ResourceNotFoundException("Direction introuvable : " + request.getIdDirection()));

        agent.setNom(request.getNom());
        agent.setPrenom(request.getPrenom());
        agent.setMatricule(request.getMatricule());
        agent.setUsername(generateUniqueUsername(request.getNom(), request.getPrenom(), agent.getIdAgent()));
        agent.setEmail(request.getEmail());
        agent.setFonction(request.getFonction());
        agent.setTelephone(request.getTelephone());
        agent.setEstChauffeur(request.isEstChauffeur());
        agent.setRole(request.getRole());
        agent.setDirection(direction);
        agent.setActif(request.isActif());

        return agentRepository.save(agent);
    }

    @Transactional
    public void deactivateAgent(Long id) {
        Agent agent = getAgentById(id);
        agent.setActif(false);
        agentRepository.save(agent);
    }

    private String generateUniqueUsername(String nom, String prenom, Long currentAgentId) {
        String username = generateBaseUsername(nom, prenom);
        String base = username;
        int suffix = 2;

        while (agentRepository.findByUsername(username)
                .filter(existing -> !existing.getIdAgent().equals(currentAgentId))
                .isPresent()) {
            username = base + suffix;
            suffix++;
        }

        return username;
    }

    private String generateBaseUsername(String nom, String prenom) {
        String nomPropre = nom.trim().toUpperCase();
        String prenomPropre = prenom.trim().toUpperCase();
        String premierPrenom = prenomPropre.split(" ")[0];
        return nomPropre.charAt(0) + premierPrenom;
    }
}
