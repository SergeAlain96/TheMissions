package com.carfo.gestion_missions.repository;

import com.carfo.gestion_missions.entity.Agent;
import com.carfo.gestion_missions.enums.RoleAgent;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface AgentRepository extends JpaRepository<Agent, Long> {

    Optional<Agent> findByEmail(String email);

    Optional<Agent> findByMatricule(String matricule);

    // Ajouter cette ligne
    Optional<Agent> findByUsername(String username);

    // Et celle-ci pour vérifier si le username existe déjà
    boolean existsByUsername(String username);

    boolean existsByEmail(String email);

    boolean existsByMatricule(String matricule);


    // Tous les chauffeurs disponibles
    @Query("SELECT a FROM Agent a WHERE a.estChauffeur = true AND a.actif = true")
    List<Agent> findAllChauffeurs();

    // Agents d'une direction
    List<Agent> findByDirectionIdDirectionAndActifTrue(Long idDirection);

    // Tous les agents actifs ayant un rôle donné (utilisé pour diffuser les notifications)
    List<Agent> findByRoleAndActifTrue(RoleAgent role);

    // Le DMG : DIRECTEUR_DIRECTION rattaché à la direction de sigle DMG
    @Query("""
        SELECT a FROM Agent a
        WHERE a.actif = true
        AND a.role = com.carfo.gestion_missions.enums.RoleAgent.DIRECTEUR_DIRECTION
        AND UPPER(a.direction.sigleDirection) = 'DMG'
    """)
    List<Agent> findDmgAgents();

    // Le ou les directeurs d'une direction donnée (par sigle)
    @Query("""
        SELECT a FROM Agent a
        WHERE a.actif = true
        AND a.role = com.carfo.gestion_missions.enums.RoleAgent.DIRECTEUR_DIRECTION
        AND UPPER(a.direction.sigleDirection) = UPPER(:sigle)
    """)
    List<Agent> findDirecteursParSigleDirection(@org.springframework.data.repository.query.Param("sigle") String sigle);

    // Compter agents actifs
    long countByActif(boolean actif);

    // Compter chauffeurs actifs
    long countByEstChauffeurAndActif(boolean estChauffeur, boolean actif);
}
