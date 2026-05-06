package com.carfo.gestion_missions.service;

import com.carfo.gestion_missions.entity.Affectation;
import com.carfo.gestion_missions.entity.Mission;
import com.carfo.gestion_missions.entity.Participe;
import com.carfo.gestion_missions.exception.BusinessRuleException;
import com.carfo.gestion_missions.repository.ParticipeRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.ByteArrayOutputStream;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
public class FicheMissionService {

    private final MissionService missionService;
    private final ParticipeRepository participeRepository;

    @Transactional(readOnly = true)
    public byte[] genererFiche(Long idMission) {
        Mission mission = missionService.getMissionById(idMission);
        List<Participe> participations = participeRepository.findByMissionIdMission(idMission);

        List<String> lines = new ArrayList<>();
        lines.add("FICHE DE MISSION");
        lines.add("Objet: " + safe(mission.getObjetMission()));
        lines.add("Lieu: " + safe(mission.getLieu()));
        lines.add("Dates: " + mission.getDateDebut() + " -> " + mission.getDateFin());
        lines.add("Direction: " + safe(mission.getDirection() != null ? mission.getDirection().getNomDirection() : "-"));
        lines.add("Statut: " + safe(mission.getStatut() != null ? mission.getStatut().name() : "-"));
        lines.add(" ");
        lines.add("Participants:");

        if (participations.isEmpty()) {
            lines.add("- Aucun participant");
        } else {
            for (Participe participe : participations) {
                lines.add("- " + safe(participe.getAgent().getPrenom()) + " " + safe(participe.getAgent().getNom())
                        + " | Matricule: " + safe(participe.getAgent().getMatricule())
                        + " | Role: " + safe(participe.getRoleMission()));
            }
        }

        Affectation affectation = mission.getAffectation();
        if (affectation != null) {
            lines.add(" ");
            lines.add("Affectation:");
            lines.add("- Chauffeur: " + safe(affectation.getChauffeur().getPrenom()) + " " + safe(affectation.getChauffeur().getNom()));
            lines.add("- Vehicule: " + safe(affectation.getVehicule().getMarque()) + " " + safe(affectation.getVehicule().getModele())
                    + " - " + safe(affectation.getVehicule().getImmatriculation()));
        }

        return buildSimplePdf(lines);
    }

    private byte[] buildSimplePdf(List<String> lines) {
        try {
            StringBuilder content = new StringBuilder();
            content.append("BT\n");
            content.append("/F1 18 Tf\n");
            content.append("50 790 Td\n");
            content.append("(FICHE DE MISSION) Tj\n");
            content.append("/F1 11 Tf\n");
            content.append("0 -28 Td\n");

            for (String line : lines.subList(1, lines.size())) {
                content.append("(").append(escapePdf(line)).append(") Tj\n");
                content.append("0 -16 Td\n");
            }
            content.append("ET");

            byte[] contentBytes = content.toString().getBytes(StandardCharsets.ISO_8859_1);

            ByteArrayOutputStream out = new ByteArrayOutputStream();
            List<Integer> offsets = new ArrayList<>();
            offsets.add(0);

            write(out, "%PDF-1.4\n");

            offsets.add(out.size());
            write(out, "1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n");

            offsets.add(out.size());
            write(out, "2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n");

            offsets.add(out.size());
            write(out, "3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>\nendobj\n");

            offsets.add(out.size());
            write(out, "4 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n");

            offsets.add(out.size());
            write(out, "5 0 obj\n<< /Length " + contentBytes.length + " >>\nstream\n");
            out.write(contentBytes);
            write(out, "\nendstream\nendobj\n");

            int xrefStart = out.size();
            write(out, "xref\n0 6\n");
            write(out, String.format("%010d 65535 f \n", 0));
            for (int i = 1; i < offsets.size(); i++) {
                write(out, String.format("%010d 00000 n \n", offsets.get(i)));
            }
            write(out, "trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n");
            write(out, String.valueOf(xrefStart) + "\n%%EOF");

            return out.toByteArray();
        } catch (Exception ex) {
            throw new BusinessRuleException("Impossible de générer la fiche PDF", ex);
        }
    }

    private void write(ByteArrayOutputStream out, String text) {
        out.writeBytes(text.getBytes(StandardCharsets.ISO_8859_1));
    }

    private String escapePdf(String value) {
        if (value == null) {
            return "-";
        }
        return value.replace("\\", "\\\\").replace("(", "\\(").replace(")", "\\)");
    }

    private String safe(String value) {
        return value == null || value.isBlank() ? "-" : value;
    }
}