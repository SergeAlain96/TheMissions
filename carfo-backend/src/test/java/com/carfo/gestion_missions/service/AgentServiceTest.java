package com.carfo.gestion_missions.service;

import com.carfo.gestion_missions.dto.AgentDTO.UpdateRequest;
import com.carfo.gestion_missions.entity.Agent;
import com.carfo.gestion_missions.entity.Direction;
import com.carfo.gestion_missions.enums.RoleAgent;
import com.carfo.gestion_missions.repository.AgentRepository;
import com.carfo.gestion_missions.repository.DirectionRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AgentServiceTest {

    @Mock
    private AgentRepository agentRepository;

    @Mock
    private DirectionRepository directionRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @InjectMocks
    private AgentService agentService;

    @Test
    void updateAgent_shouldPersistUpdatedFields() {
        Agent existing = Agent.builder()
                .idAgent(1L)
                .nom("Ancien")
                .prenom("Nom")
                .matricule("MAT-001")
                .username("ANCIEN")
                .email("ancien@carfo.com")
                .fonction("Chef")
                .telephone("000000")
                .estChauffeur(false)
                .role(RoleAgent.AGENT)
                .actif(true)
                .build();

        Direction direction = Direction.builder().idDirection(2L).nomDirection("Direction A").build();

        UpdateRequest request = UpdateRequest.builder()
                .nom("Nouveau")
                .prenom("Prenom")
                .matricule("MAT-002")
                .email("nouveau@carfo.com")
                .fonction("Directeur")
                .telephone("123456")
                .estChauffeur(true)
                .role(RoleAgent.DIRECTEUR)
                .idDirection(2L)
                .actif(true)
                .build();

        when(agentRepository.findById(1L)).thenReturn(Optional.of(existing));
        when(agentRepository.existsByEmail(request.getEmail())).thenReturn(false);
        when(agentRepository.existsByMatricule(request.getMatricule())).thenReturn(false);
        when(directionRepository.findById(2L)).thenReturn(Optional.of(direction));
        when(agentRepository.findByUsername("NPRENOM")).thenReturn(Optional.empty());
        when(agentRepository.save(any(Agent.class))).thenAnswer(invocation -> invocation.getArgument(0));

        Agent updated = agentService.updateAgent(1L, request);

        assertThat(updated.getNom()).isEqualTo("Nouveau");
        assertThat(updated.getPrenom()).isEqualTo("Prenom");
        assertThat(updated.getMatricule()).isEqualTo("MAT-002");
        assertThat(updated.getEmail()).isEqualTo("nouveau@carfo.com");
        assertThat(updated.getDirection()).isEqualTo(direction);
        assertThat(updated.isEstChauffeur()).isTrue();

        ArgumentCaptor<Agent> captor = ArgumentCaptor.forClass(Agent.class);
        verify(agentRepository).save(captor.capture());
        assertThat(captor.getValue().getUsername()).isEqualTo("NPRENOM");
    }

    @Test
    void deactivateAgent_shouldMarkAgentInactive() {
        Agent existing = Agent.builder().idAgent(1L).actif(true).build();
        when(agentRepository.findById(1L)).thenReturn(Optional.of(existing));
        when(agentRepository.save(any(Agent.class))).thenAnswer(invocation -> invocation.getArgument(0));

        agentService.deactivateAgent(1L);

        assertThat(existing.isActif()).isFalse();
        verify(agentRepository).save(existing);
    }

    @Test
    void getAllChauffeurs_shouldReturnRepositoryResult() {
        when(agentRepository.findAllChauffeurs()).thenReturn(List.of());

        assertThat(agentService.getAllChauffeurs()).isEmpty();
    }

    @Test
    void getAgentById_shouldThrowWhenMissing() {
        when(agentRepository.findById(99L)).thenReturn(Optional.empty());

        assertThrows(RuntimeException.class, () -> agentService.getAgentById(99L));
    }
}
