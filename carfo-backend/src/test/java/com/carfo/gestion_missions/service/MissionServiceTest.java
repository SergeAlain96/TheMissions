package com.carfo.gestion_missions.service;

import com.carfo.gestion_missions.entity.*;
import com.carfo.gestion_missions.enums.RoleAgent;
import com.carfo.gestion_missions.enums.StatutMission;
import com.carfo.gestion_missions.enums.StatutVehicule;
import com.carfo.gestion_missions.repository.*;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class MissionServiceTest {

    @Mock
    private MissionRepository missionRepository;

    @Mock
    private AgentRepository agentRepository;

    @Mock
    private DirectionRepository directionRepository;

    @Mock
    private ParticipeRepository participeRepository;

    @Mock
    private AffectationRepository affectationRepository;

    @Mock
    private VehiculeRepository vehiculeRepository;

    @InjectMocks
    private MissionService missionService;

    @Test
    void soumettreMission_shouldRejectWhenLessThanTenDays() {
        LocalDate dateDebut = LocalDate.now().plusDays(5);
        LocalDate dateFin = LocalDate.now().plusDays(7);

        assertThrows(RuntimeException.class, () -> missionService.soumettreMission(
                dateDebut,
                dateFin,
                "Ouaga",
                "Mission de test",
                1L,
                List.of(),
                List.of()
        ));
    }

    @Test
    void validerMission_shouldSetStatusToInitiee() {
        // Nouveau workflow : la validation finale par le DG n'est possible
        // qu'après un avis favorable du Secrétariat Général.
        Mission mission = Mission.builder()
                .idMission(1L)
                .statut(StatutMission.AVIS_SG_FAVORABLE)
                .dateDebut(LocalDate.now().plusDays(12))
                .dateFin(LocalDate.now().plusDays(14))
                .dateSoumission(LocalDateTime.now())
                .build();

        when(missionRepository.findById(1L)).thenReturn(Optional.of(mission));
        when(missionRepository.save(any(Mission.class))).thenAnswer(invocation -> invocation.getArgument(0));

        Mission updated = missionService.validerMission(1L);

        assertThat(updated.getStatut()).isEqualTo(StatutMission.INITIEE);
        verify(missionRepository).save(mission);
    }

    @Test
    void soumettreMission_shouldCreateMissionAndParticipants() {
        Direction direction = Direction.builder().idDirection(1L).nomDirection("Direction A").build();
        Agent agent = Agent.builder()
                .idAgent(10L)
                .nom("Yameogo")
                .prenom("Angelo")
                .email("angelo@carfo.com")
                .role(RoleAgent.AGENT)
                .username("YANGELO")
                .actif(true)
                .build();

        when(directionRepository.findById(1L)).thenReturn(Optional.of(direction));
        when(missionRepository.save(any(Mission.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(agentRepository.findById(10L)).thenReturn(Optional.of(agent));
        when(participeRepository.saveAll(anyList())).thenAnswer(invocation -> invocation.getArgument(0));

        Mission mission = missionService.soumettreMission(
                LocalDate.now().plusDays(12),
                LocalDate.now().plusDays(15),
                "Ouagadougou",
                "Mission test",
                1L,
                List.of(10L),
                List.of("MEMBRE")
        );

        assertThat(mission.getLieu()).isEqualTo("Ouagadougou");
        assertThat(mission.getStatut()).isEqualTo(StatutMission.PREVUE);
        verify(participeRepository).saveAll(anyList());
    }

    @Test
    void affecterRessources_shouldAssignVehicleAndDriver() {
        Mission mission = Mission.builder()
                .idMission(1L)
                .statut(StatutMission.INITIEE)
                .dateDebut(LocalDate.now().plusDays(12))
                .dateFin(LocalDate.now().plusDays(14))
                .dateSoumission(LocalDateTime.now())
                .build();
        Agent chauffeur = Agent.builder()
                .idAgent(20L)
                .nom("Driver")
                .prenom("One")
                .estChauffeur(true)
                .actif(true)
                .role(RoleAgent.AGENT)
                .username("DONE")
                .build();
        Vehicule vehicule = Vehicule.builder()
                .idVehicule(30L)
                .immatriculation("AA-123-BB")
                .statut(StatutVehicule.DISPONIBLE)
                .actif(true)
                .marque("Toyota")
                .modele("Hilux")
                .build();

        when(missionRepository.findById(1L)).thenReturn(Optional.of(mission));
        when(agentRepository.findById(20L)).thenReturn(Optional.of(chauffeur));
        when(vehiculeRepository.findById(30L)).thenReturn(Optional.of(vehicule));
        when(affectationRepository.findByMissionIdMission(1L)).thenReturn(Optional.empty());
        when(affectationRepository.save(any(Affectation.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(vehiculeRepository.save(any(Vehicule.class))).thenAnswer(invocation -> invocation.getArgument(0));

        Affectation affectation = missionService.affecterRessources(1L, 20L, 30L);

        assertThat(affectation.getChauffeur()).isEqualTo(chauffeur);
        assertThat(affectation.getVehicule()).isEqualTo(vehicule);
        assertThat(vehicule.getStatut()).isEqualTo(StatutVehicule.EN_MISSION);
    }
}
