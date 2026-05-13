package com.carfo.gestion_missions.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "participe")
@Getter @Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Participe {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_agent", nullable = false)
    private Agent agent;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_mission", nullable = false)
    @JsonIgnore
    private Mission mission;

    // Rôle dans la mission : CHEF_MISSION ou MEMBRE
    @Column(name = "role_mission", length = 50)
    private String roleMission;
}
