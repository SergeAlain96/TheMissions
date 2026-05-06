package com.carfo.gestion_missions.service;

import com.carfo.gestion_missions.dto.DirectionDTO.Request;
import com.carfo.gestion_missions.entity.Direction;
import com.carfo.gestion_missions.repository.DirectionRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class DirectionServiceTest {

    @Mock
    private DirectionRepository directionRepository;

    @InjectMocks
    private DirectionService directionService;

    @Test
    void createDirection_shouldSaveNewDirection() {
        Request request = Request.builder()
                .nomDirection("Direction des Ressources Humaines")
                .sigleDirection("DRH")
                .build();

        when(directionRepository.existsByNomDirection(request.getNomDirection())).thenReturn(false);
        when(directionRepository.save(any(Direction.class))).thenAnswer(invocation -> invocation.getArgument(0));

        Direction created = directionService.createDirection(request);

        assertThat(created.getNomDirection()).isEqualTo("Direction des Ressources Humaines");
        assertThat(created.getSigleDirection()).isEqualTo("DRH");

        ArgumentCaptor<Direction> captor = ArgumentCaptor.forClass(Direction.class);
        verify(directionRepository).save(captor.capture());
        assertThat(captor.getValue().getNomDirection()).isEqualTo("Direction des Ressources Humaines");
    }

    @Test
    void updateDirection_shouldModifyExistingDirection() {
        Direction existing = Direction.builder()
                .idDirection(1L)
                .nomDirection("Ancienne Direction")
                .sigleDirection("AD")
                .build();

        Request request = Request.builder()
                .nomDirection("Nouvelle Direction")
                .sigleDirection("ND")
                .build();

        when(directionRepository.findById(1L)).thenReturn(Optional.of(existing));
        when(directionRepository.existsByNomDirection(request.getNomDirection())).thenReturn(false);
        when(directionRepository.save(any(Direction.class))).thenAnswer(invocation -> invocation.getArgument(0));

        Direction updated = directionService.updateDirection(1L, request);

        assertThat(updated.getNomDirection()).isEqualTo("Nouvelle Direction");
        assertThat(updated.getSigleDirection()).isEqualTo("ND");
        verify(directionRepository).save(existing);
    }

    @Test
    void getAllDirections_shouldReturnRepositoryResult() {
        when(directionRepository.findAll()).thenReturn(List.of());

        List<Direction> directions = directionService.getAllDirections();

        assertThat(directions).isEmpty();
    }

    @Test
    void getDirectionById_shouldThrowWhenMissing() {
        when(directionRepository.findById(99L)).thenReturn(Optional.empty());

        assertThrows(RuntimeException.class, () -> directionService.getDirectionById(99L));
    }
}
