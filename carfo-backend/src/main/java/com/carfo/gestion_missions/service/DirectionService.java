package com.carfo.gestion_missions.service;

import com.carfo.gestion_missions.dto.DirectionDTO.Request;
import com.carfo.gestion_missions.entity.Direction;
import com.carfo.gestion_missions.exception.DuplicateResourceException;
import com.carfo.gestion_missions.exception.ResourceNotFoundException;
import com.carfo.gestion_missions.repository.DirectionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class DirectionService {

    private final DirectionRepository directionRepository;

    public List<Direction> getAllDirections() {
        return directionRepository.findAll();
    }

    public Direction getDirectionById(Long id) {
        return directionRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Direction introuvable : " + id));
    }

    @Transactional
    public Direction createDirection(Request request) {
        if (directionRepository.existsByNomDirection(request.getNomDirection())) {
            throw new DuplicateResourceException("Une direction portant ce nom existe déjà : " + request.getNomDirection());
        }

        Direction direction = Direction.builder()
                .nomDirection(request.getNomDirection())
                .sigleDirection(request.getSigleDirection())
                .build();

        return directionRepository.save(direction);
    }

    @Transactional
    public Direction updateDirection(Long id, Request request) {
        Direction direction = getDirectionById(id);

        if (!direction.getNomDirection().equalsIgnoreCase(request.getNomDirection())
                && directionRepository.existsByNomDirection(request.getNomDirection())) {
            throw new DuplicateResourceException("Une direction portant ce nom existe déjà : " + request.getNomDirection());
        }

        direction.setNomDirection(request.getNomDirection());
        direction.setSigleDirection(request.getSigleDirection());
        return directionRepository.save(direction);
    }

    @Transactional
    public void deleteDirection(Long id) {
        Direction direction = getDirectionById(id);
        directionRepository.delete(direction);
    }
}
