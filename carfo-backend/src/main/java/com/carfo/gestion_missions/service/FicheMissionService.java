package com.carfo.gestion_missions.service;

import com.carfo.gestion_missions.entity.Affectation;
import com.carfo.gestion_missions.entity.Mission;
import com.carfo.gestion_missions.entity.Participe;
import com.carfo.gestion_missions.exception.BusinessRuleException;
import com.carfo.gestion_missions.repository.ParticipeRepository;
import com.lowagie.text.Chunk;
import com.lowagie.text.Document;
import com.lowagie.text.Element;
import com.lowagie.text.Font;
import com.lowagie.text.FontFactory;
import com.lowagie.text.Image;
import com.lowagie.text.PageSize;
import com.lowagie.text.Paragraph;
import com.lowagie.text.Phrase;
import com.lowagie.text.Rectangle;
import com.lowagie.text.pdf.PdfPCell;
import com.lowagie.text.pdf.PdfPTable;
import com.lowagie.text.pdf.PdfWriter;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.awt.Color;
import java.io.ByteArrayOutputStream;
import java.io.InputStream;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Locale;

@Slf4j
@Service
@RequiredArgsConstructor
public class FicheMissionService {

    private static final Color CARFO_GREEN      = new Color(13, 92, 63);     // #0D5C3F
    private static final Color CARFO_GREEN_DARK = new Color(7, 54, 35);      // #073623
    private static final Color INK_900          = new Color(15, 23, 42);     // #0F172A
    private static final Color INK_500          = new Color(100, 116, 139);  // #64748B
    private static final Color INK_100          = new Color(241, 245, 249);  // #F1F5F9
    private static final Color INK_200          = new Color(226, 232, 240);  // #E2E8F0
    private static final Color GOLD             = new Color(180, 139, 34);   // #B48B22

    private static final DateTimeFormatter DATE_FR = DateTimeFormatter.ofPattern("dd MMMM yyyy", Locale.FRENCH);

    private final MissionService missionService;
    private final ParticipeRepository participeRepository;

    @Transactional(readOnly = true)
    public byte[] genererFiche(Long idMission) {
        Mission mission = missionService.getMissionById(idMission);
        List<Participe> participations = participeRepository.findByMissionIdMission(idMission);

        try (ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            Document doc = new Document(PageSize.A4, 48f, 48f, 48f, 60f);
            PdfWriter.getInstance(doc, out);
            doc.open();

            doc.add(buildHeader(mission));
            doc.add(spacer(14f));
            doc.add(buildTitleBlock(mission));
            doc.add(spacer(18f));
            doc.add(buildInfoTable(mission));
            doc.add(spacer(18f));
            doc.add(buildParticipantsBlock(participations));

            if (mission.getAffectation() != null) {
                doc.add(spacer(18f));
                doc.add(buildAffectationBlock(mission.getAffectation()));
            }

            doc.add(spacer(28f));
            doc.add(buildFooter());

            doc.close();
            return out.toByteArray();
        } catch (Exception ex) {
            log.error("Échec génération PDF mission {}", idMission, ex);
            throw new BusinessRuleException("Impossible de générer la fiche PDF", ex);
        }
    }

    // ------------------------------------------------------------------
    // Composants visuels
    // ------------------------------------------------------------------

    private PdfPTable buildHeader(Mission mission) throws Exception {
        PdfPTable table = new PdfPTable(new float[]{ 1f, 4f });
        table.setWidthPercentage(100);
        table.setSpacingAfter(6f);

        // Logo CARFO (gauche)
        PdfPCell logoCell = new PdfPCell();
        logoCell.setBorder(Rectangle.NO_BORDER);
        logoCell.setVerticalAlignment(Element.ALIGN_MIDDLE);
        try (InputStream is = new ClassPathResource("static/images/carfo-logo.png").getInputStream()) {
            byte[] bytes = is.readAllBytes();
            Image logo = Image.getInstance(bytes);
            logo.scaleToFit(70f, 70f);
            logoCell.addElement(logo);
        } catch (Exception ignored) {
            logoCell.addElement(new Phrase("CARFO", FontFactory.getFont(FontFactory.HELVETICA_BOLD, 18, CARFO_GREEN)));
        }
        table.addCell(logoCell);

        // Bloc institutionnel (droite)
        PdfPCell orgCell = new PdfPCell();
        orgCell.setBorder(Rectangle.NO_BORDER);
        orgCell.setVerticalAlignment(Element.ALIGN_MIDDLE);

        Paragraph p1 = new Paragraph("BURKINA FASO",
                FontFactory.getFont(FontFactory.HELVETICA_BOLD, 9, INK_500));
        p1.setAlignment(Element.ALIGN_RIGHT);
        orgCell.addElement(p1);

        Paragraph p2 = new Paragraph("La patrie ou la mort, nous vaincrons",
                FontFactory.getFont(FontFactory.HELVETICA_OBLIQUE, 8, INK_500));
        p2.setAlignment(Element.ALIGN_RIGHT);
        orgCell.addElement(p2);

        Paragraph p3 = new Paragraph("\nCaisse Autonome de Retraite des Fonctionnaires",
                FontFactory.getFont(FontFactory.HELVETICA_BOLD, 11, CARFO_GREEN_DARK));
        p3.setAlignment(Element.ALIGN_RIGHT);
        orgCell.addElement(p3);

        Paragraph p4 = new Paragraph("Direction Générale — Ouagadougou",
                FontFactory.getFont(FontFactory.HELVETICA, 9, INK_500));
        p4.setAlignment(Element.ALIGN_RIGHT);
        orgCell.addElement(p4);

        table.addCell(orgCell);

        // Séparateur fin
        PdfPCell divider = new PdfPCell();
        divider.setColspan(2);
        divider.setBorder(Rectangle.BOTTOM);
        divider.setBorderColor(GOLD);
        divider.setBorderWidth(1.5f);
        divider.setFixedHeight(6f);
        table.addCell(divider);

        return table;
    }

    private Paragraph buildTitleBlock(Mission mission) {
        Paragraph title = new Paragraph();
        title.setAlignment(Element.ALIGN_CENTER);

        Chunk eyebrow = new Chunk("FICHE DE DEMANDE DE MISSION",
                FontFactory.getFont(FontFactory.HELVETICA_BOLD, 9, GOLD));
        title.add(eyebrow);
        title.add(Chunk.NEWLINE);
        title.add(new Chunk("\n", FontFactory.getFont(FontFactory.HELVETICA, 4)));

        Chunk h1 = new Chunk(safe(mission.getObjetMission()),
                FontFactory.getFont(FontFactory.HELVETICA_BOLD, 18, CARFO_GREEN_DARK));
        title.add(h1);
        title.add(Chunk.NEWLINE);

        Chunk meta = new Chunk("Référence : MIS-" + mission.getIdMission() + "  •  Statut : " + mission.getStatut(),
                FontFactory.getFont(FontFactory.HELVETICA, 9, INK_500));
        title.add(meta);

        return title;
    }

    private PdfPTable buildInfoTable(Mission mission) {
        PdfPTable table = new PdfPTable(new float[]{ 1f, 2f, 1f, 2f });
        table.setWidthPercentage(100);
        table.setSpacingBefore(4f);

        long durationDays = Math.max(1,
                java.time.temporal.ChronoUnit.DAYS.between(mission.getDateDebut(), mission.getDateFin()) + 1);

        addLabelValue(table, "Direction",   safe(mission.getDirection() != null ? mission.getDirection().getNomDirection() : null));
        addLabelValue(table, "Lieu",        safe(mission.getLieu()));
        addLabelValue(table, "Date début",  fmt(mission.getDateDebut()));
        addLabelValue(table, "Date fin",    fmt(mission.getDateFin()));
        addLabelValue(table, "Durée",       durationDays + " jour(s)");
        addLabelValue(table, "Soumise le",  mission.getDateSoumission() != null ? mission.getDateSoumission().toLocalDate().format(DATE_FR) : "—");

        return table;
    }

    private PdfPTable buildParticipantsBlock(List<Participe> participations) {
        PdfPTable section = new PdfPTable(1);
        section.setWidthPercentage(100);

        PdfPCell title = sectionTitle("Participants à la mission (" + participations.size() + ")");
        section.addCell(title);

        if (participations.isEmpty()) {
            PdfPCell empty = new PdfPCell(new Phrase("Aucun participant déclaré pour cette mission.",
                    FontFactory.getFont(FontFactory.HELVETICA_OBLIQUE, 10, INK_500)));
            empty.setBorder(Rectangle.NO_BORDER);
            empty.setPaddingTop(8f);
            empty.setPaddingBottom(8f);
            section.addCell(empty);
            return section;
        }

        PdfPTable table = new PdfPTable(new float[]{ 0.6f, 1.2f, 1.6f, 1f });
        table.setWidthPercentage(100);
        table.setSpacingBefore(6f);

        addHeader(table, "N°");
        addHeader(table, "Matricule");
        addHeader(table, "Nom et prénom");
        addHeader(table, "Rôle");

        int idx = 1;
        for (Participe p : participations) {
            addBody(table, String.valueOf(idx++));
            addBody(table, safe(p.getAgent().getMatricule()));
            addBody(table, safe(p.getAgent().getPrenom()) + " " + safe(p.getAgent().getNom()));
            addBody(table, safe(p.getRoleMission()));
        }

        PdfPCell wrapper = new PdfPCell();
        wrapper.setBorder(Rectangle.NO_BORDER);
        wrapper.addElement(table);
        section.addCell(wrapper);

        return section;
    }

    private PdfPTable buildAffectationBlock(Affectation affectation) {
        PdfPTable section = new PdfPTable(1);
        section.setWidthPercentage(100);

        section.addCell(sectionTitle("Affectation des ressources"));

        PdfPTable table = new PdfPTable(new float[]{ 1f, 2f, 1f, 2f });
        table.setWidthPercentage(100);
        table.setSpacingBefore(6f);

        addLabelValue(table, "Chauffeur",
                safe(affectation.getChauffeur().getPrenom()) + " " + safe(affectation.getChauffeur().getNom()));
        addLabelValue(table, "Matricule",
                safe(affectation.getChauffeur().getMatricule()));
        addLabelValue(table, "Véhicule",
                safe(affectation.getVehicule().getMarque()) + " " + safe(affectation.getVehicule().getModele()));
        addLabelValue(table, "Immatriculation",
                safe(affectation.getVehicule().getImmatriculation()));

        PdfPCell wrapper = new PdfPCell();
        wrapper.setBorder(Rectangle.NO_BORDER);
        wrapper.addElement(table);
        section.addCell(wrapper);

        return section;
    }

    private PdfPTable buildFooter() {
        PdfPTable table = new PdfPTable(new float[]{ 1f, 1f });
        table.setWidthPercentage(100);

        PdfPCell left = new PdfPCell();
        left.setBorder(Rectangle.TOP);
        left.setBorderColor(INK_200);
        left.setPaddingTop(8f);

        Paragraph p1 = new Paragraph("Document généré le " + LocalDate.now().format(DATE_FR),
                FontFactory.getFont(FontFactory.HELVETICA, 8, INK_500));
        left.addElement(p1);
        Paragraph p2 = new Paragraph("CARFO — Système de gestion des missions",
                FontFactory.getFont(FontFactory.HELVETICA, 8, INK_500));
        left.addElement(p2);
        table.addCell(left);

        PdfPCell right = new PdfPCell();
        right.setBorder(Rectangle.TOP);
        right.setBorderColor(INK_200);
        right.setPaddingTop(8f);
        Paragraph sign = new Paragraph("Signature et cachet",
                FontFactory.getFont(FontFactory.HELVETICA_BOLD, 9, INK_900));
        sign.setAlignment(Element.ALIGN_RIGHT);
        right.addElement(sign);
        table.addCell(right);

        return table;
    }

    // ------------------------------------------------------------------
    // Helpers cellules
    // ------------------------------------------------------------------

    private PdfPCell sectionTitle(String text) {
        PdfPCell cell = new PdfPCell(new Phrase(text,
                FontFactory.getFont(FontFactory.HELVETICA_BOLD, 11, CARFO_GREEN_DARK)));
        cell.setBackgroundColor(INK_100);
        cell.setBorder(Rectangle.LEFT);
        cell.setBorderColor(CARFO_GREEN);
        cell.setBorderWidth(2.5f);
        cell.setPadding(8f);
        cell.setPaddingLeft(12f);
        return cell;
    }

    private void addLabelValue(PdfPTable table, String label, String value) {
        PdfPCell labelCell = new PdfPCell(new Phrase(label.toUpperCase(),
                FontFactory.getFont(FontFactory.HELVETICA_BOLD, 8, INK_500)));
        labelCell.setBorder(Rectangle.NO_BORDER);
        labelCell.setBackgroundColor(INK_100);
        labelCell.setPadding(8f);
        labelCell.setVerticalAlignment(Element.ALIGN_MIDDLE);
        table.addCell(labelCell);

        PdfPCell valueCell = new PdfPCell(new Phrase(value,
                FontFactory.getFont(FontFactory.HELVETICA_BOLD, 10, INK_900)));
        valueCell.setBorder(Rectangle.BOTTOM);
        valueCell.setBorderColor(INK_200);
        valueCell.setPadding(8f);
        valueCell.setVerticalAlignment(Element.ALIGN_MIDDLE);
        table.addCell(valueCell);
    }

    private void addHeader(PdfPTable table, String label) {
        PdfPCell cell = new PdfPCell(new Phrase(label.toUpperCase(),
                FontFactory.getFont(FontFactory.HELVETICA_BOLD, 8, Color.WHITE)));
        cell.setBackgroundColor(CARFO_GREEN);
        cell.setPadding(7f);
        cell.setBorder(Rectangle.NO_BORDER);
        table.addCell(cell);
    }

    private void addBody(PdfPTable table, String value) {
        PdfPCell cell = new PdfPCell(new Phrase(value,
                FontFactory.getFont(FontFactory.HELVETICA, 10, INK_900)));
        cell.setPadding(7f);
        cell.setBorder(Rectangle.BOTTOM);
        cell.setBorderColor(INK_200);
        table.addCell(cell);
    }

    private Paragraph spacer(float height) {
        Paragraph p = new Paragraph(" ");
        p.setSpacingAfter(height);
        return p;
    }

    private String fmt(LocalDate date) {
        return date != null ? date.format(DATE_FR) : "—";
    }

    private String safe(String value) {
        return value == null || value.isBlank() ? "—" : value;
    }
}
