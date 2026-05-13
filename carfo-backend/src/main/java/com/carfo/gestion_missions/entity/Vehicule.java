package com.carfo.gestion_missions.entity;

import com.carfo.gestion_missions.enums.StatutVehicule;
import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;
import java.util.List;

@Entity
@Table(name = "vehicule")
@Getter @Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class Vehicule {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_vehicule")
    private Long idVehicule;

    @Column(name = "marque", nullable = false, length = 100)
    private String marque;

    @Column(name = "modele", nullable = false, length = 100)
    private String modele;

    @Column(name = "immatriculation", nullable = false, unique = true, length = 20)
    private String immatriculation;

    @Column(name = "type_vehicule", length = 50)
    private String typeVehicule;

    @Column(name = "capacite")
    private Integer capacite;

    @Column(name = "date_acquisition")
    private LocalDate dateAcquisition;

    @Enumerated(EnumType.STRING)
    @Column(name = "statut", nullable = false)
    @Builder.Default
    private StatutVehicule statut = StatutVehicule.DISPONIBLE;

    @Column(name = "actif", nullable = false)
    @Builder.Default
    private boolean actif = true;

    // Affectations du véhicule
    @OneToMany(mappedBy = "vehicule", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    @JsonIgnore
    private List<Affectation> affectations;
}
