package com.carfo.gestion_missions.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.*;

import java.util.List;

@Entity
@Table(name = "direction")
@Getter @Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class Direction {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_direction")
    private Long idDirection;

    @Column(name = "nom_direction", nullable = false, length = 150)
    private String nomDirection;

    @Column(name = "sigle_direction", length = 20)
    private String sigleDirection;

    // Une direction possède plusieurs agents
    @OneToMany(mappedBy = "direction", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    @JsonIgnore
    private List<Agent> agents;

    // Une direction soumet plusieurs missions
    @OneToMany(mappedBy = "direction", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    @JsonIgnore
    private List<Mission> missions;
}
