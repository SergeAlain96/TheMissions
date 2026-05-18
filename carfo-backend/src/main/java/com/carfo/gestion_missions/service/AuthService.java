package com.carfo.gestion_missions.service;

import com.carfo.gestion_missions.config.DataInitializer;
import com.carfo.gestion_missions.dto.AuthDTO.LoginRequest;
import com.carfo.gestion_missions.dto.AuthDTO.RegisterRequest;
import com.carfo.gestion_missions.dto.AuthDTO.JwtResponse;
import com.carfo.gestion_missions.dto.AuthDTO.RegisterResponse;
import com.carfo.gestion_missions.entity.Agent;
import com.carfo.gestion_missions.entity.Direction;
import com.carfo.gestion_missions.enums.RoleAgent;
import com.carfo.gestion_missions.exception.BusinessRuleException;
import com.carfo.gestion_missions.repository.AgentRepository;
import com.carfo.gestion_missions.repository.DirectionRepository;
import com.carfo.gestion_missions.security.JwtUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Objects;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final AgentRepository agentRepository;
    private final DirectionRepository directionRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtils jwtUtils;
    private final AuthenticationManager authenticationManager;

    public JwtResponse login(LoginRequest request) {
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(
                        request.getEmail(),
                        request.getMotDePasse()
                )
        );

        Agent agent = (Agent) authentication.getPrincipal();
        String token = jwtUtils.generateToken(agent);

        return JwtResponse.builder()
                .token(token)
                .idAgent(agent.getIdAgent())
                .nom(agent.getNom())
                .prenom(agent.getPrenom())
                .email(agent.getEmail())
                .role(agent.getRole())
                .nomDirection(agent.getDirection().getNomDirection())
                .build();
    }

    @Transactional
    public RegisterResponse register(RegisterRequest request) {
        if (agentRepository.existsByEmail(request.getEmail())) {
            throw new IllegalArgumentException("Cet email est déjà utilisé : " + request.getEmail());
        }
        if (agentRepository.existsByMatricule(request.getMatricule())) {
            throw new IllegalArgumentException("Ce matricule est déjà utilisé : " + request.getMatricule());
        }

        if (request.isEstChauffeur() && !isCurrentUserDmg()) {
            throw new BusinessRuleException("Seul le DMG peut créer un chauffeur.");
        }

        Long idDirection = Objects.requireNonNull(request.getIdDirection(), "idDirection est obligatoire");

        Direction direction = directionRepository.findById(idDirection)
                .orElseThrow(() -> new IllegalArgumentException("Direction introuvable : " + idDirection));

        // Générer le username automatiquement
        String username = genererUsername(request.getNom(), request.getPrenom());

        // Si déjà existant : ajouter un suffixe numérique
        String usernameBase = username;
        int compteur = 2;
        while (agentRepository.existsByUsername(username)) {
            username = usernameBase + compteur;
            compteur++;
        }

        Agent agent = Agent.builder()
                .nom(request.getNom())
                .prenom(request.getPrenom())
                .matricule(request.getMatricule())
                .username(username)
                .email(request.getEmail())
                .motDePasse(passwordEncoder.encode(request.getMotDePasse()))
                .fonction(request.getFonction())
                .telephone(request.getTelephone())
                .estChauffeur(request.isEstChauffeur())
                .role(request.getRole())
                .direction(direction)
                .actif(true)
                .build();

        Agent saved = agentRepository.save(Objects.requireNonNull(agent, "agent ne doit pas être null"));

        return RegisterResponse.builder()
            .idAgent(saved.getIdAgent())
            .nom(saved.getNom())
            .prenom(saved.getPrenom())
            .email(saved.getEmail())
            .role(saved.getRole())
            .nomDirection(saved.getDirection().getNomDirection())
            .username(saved.getUsername())
            .build();
    }

    /**
     * Le DMG est le DIRECTEUR_DIRECTION de la Direction des Moyens Généraux (sigle "DMG").
     * Tout autre directeur de direction n'est PAS le DMG, même s'il a le rôle DIRECTEUR_DIRECTION.
     */
    private boolean isCurrentUserDmg() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated()) {
            return false;
        }

        Object principal = authentication.getPrincipal();
        if (!(principal instanceof Agent agent)) {
            return false;
        }

        if (agent.getRole() != RoleAgent.DIRECTEUR_DIRECTION) {
            return false;
        }

        Direction direction = agent.getDirection();
        return direction != null
                && DataInitializer.SIGLE_DMG.equalsIgnoreCase(direction.getSigleDirection());
    }

    // Génère le username : 1ère lettre du NOM + PRENOM complet
    // Exemple : YAMEOGO ANGELO → YANGELO
    private String genererUsername(String nom, String prenom) {

        // Nettoyer : enlever les accents et mettre en majuscules
        String nomPropre    = nom.trim().toUpperCase();
        String prenomPropre = prenom.trim().toUpperCase();

        // Prendre seulement le PREMIER prénom (si plusieurs prénoms)
        // Exemple : "ANGELO MARIO" → on prend "ANGELO"
        String premierPrenom = prenomPropre.split(" ")[0];

        // 1ère lettre du nom + premier prénom complet
        return nomPropre.charAt(0) + premierPrenom; // Résultat : "YANGELO"
    }
}
