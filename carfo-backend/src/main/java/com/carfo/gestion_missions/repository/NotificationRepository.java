package com.carfo.gestion_missions.repository;

import com.carfo.gestion_missions.entity.Notification;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface NotificationRepository extends JpaRepository<Notification, Long> {

    List<Notification> findByDestinataireIdAgentOrderByDateCreationDesc(Long idAgent, Pageable pageable);

    long countByDestinataireIdAgentAndLueFalse(Long idAgent);

    @Modifying
    @Query("UPDATE Notification n SET n.lue = true, n.dateLue = CURRENT_TIMESTAMP " +
            "WHERE n.destinataire.idAgent = :idAgent AND n.lue = false")
    int markAllAsReadForAgent(@Param("idAgent") Long idAgent);
}
