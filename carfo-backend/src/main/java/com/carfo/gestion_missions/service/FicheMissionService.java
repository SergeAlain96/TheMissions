package com.carfo.gestion_missions.service;

import com.carfo.gestion_missions.entity.Affectation;
import com.carfo.gestion_missions.entity.Mission;
import com.carfo.gestion_missions.entity.Participe;
import com.carfo.gestion_missions.exception.BusinessRuleException;
import com.carfo.gestion_missions.repository.ParticipeRepository;
import com.lowagie.text.Chunk;
import com.lowagie.text.Document;
import com.lowagie.text.Element;
import com.lowagie.text.FontFactory;
import com.lowagie.text.Image;
import com.lowagie.text.PageSize;
import com.lowagie.text.Paragraph;
import com.lowagie.text.Phrase;
import com.lowagie.text.Rectangle;
import com.lowagie.text.pdf.PdfContentByte;
import com.lowagie.text.pdf.PdfPCell;
import com.lowagie.text.pdf.PdfPTable;
import com.lowagie.text.pdf.PdfPageEventHelper;
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

/**
 * Génération de la fiche de demande de mission au format PDF.
 *
 * Charte visuelle : palette eCARFO (vert vif #16A34A + or institutionnel).
 * Structure : en-tête institutionnel → badge référence → bloc d'informations →
 * participants (zebra) → affectations (tableau unique multi-rangées) → bloc signatures.
 * Le footer (numéro de page + mention) est ajouté automatiquement à chaque page.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class FicheMissionService {

    // ────────────────────────────────────────────────────────────────────
    // Palette
    // ────────────────────────────────────────────────────────────────────
    private static final Color CARFO_GREEN       = new Color(22, 163, 74);   // #16A34A — vert vif eCARFO
    private static final Color CARFO_GREEN_DARK  = new Color(21, 128, 61);   // #15803D
    private static final Color CARFO_GREEN_DEEP  = new Color(20, 83, 45);    // #14532D
    private static final Color CARFO_GREEN_LIGHT = new Color(236, 253, 243); // #ECFDF3
    private static final Color INK_900           = new Color(15, 23, 42);    // #0F172A
    private static final Color INK_700           = new Color(51, 65, 85);    // #334155
    private static final Color INK_500           = new Color(100, 116, 139); // #64748B
    private static final Color INK_400           = new Color(148, 163, 184); // #94A3B8
    private static final Color INK_200           = new Color(226, 232, 240); // #E2E8F0
    private static final Color INK_100           = new Color(241, 245, 249); // #F1F5F9
    private static final Color INK_50            = new Color(248, 250, 252); // #F8FAFC
    private static final Color GOLD              = new Color(180, 139, 34);  // #B48B22

    private static final DateTimeFormatter DATE_FR = DateTimeFormatter.ofPattern("dd MMMM yyyy", Locale.FRENCH);

    private final MissionService missionService;
    private final ParticipeRepository participeRepository;
    private final AppConfigService appConfigService;

    @Transactional(readOnly = true)
    public byte[] genererFiche(Long idMission) {
        Mission mission = missionService.getMissionById(idMission);
        List<Participe> participations = participeRepository.findByMissionIdMission(idMission);
        com.carfo.gestion_missions.entity.AppConfig cfg = appConfigService.get();

        try (ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            // Marges : haut 110pt pour laisser place à la bande verte d'en-tête, bas 60pt pour le footer
            Document doc = new Document(PageSize.A4, 42f, 42f, 110f, 70f);
            PdfWriter writer = PdfWriter.getInstance(doc, out);
            writer.setPageEvent(new HeaderFooterEvent(mission, cfg));
            doc.open();

            // Espacements compacts pour tenir sur une seule page A4.
            doc.add(buildReferenceBadge(mission));
            doc.add(spacer(8f));
            doc.add(buildTitleBlock(mission));
            doc.add(spacer(12f));
            doc.add(buildInfoTable(mission));
            doc.add(spacer(12f));
            doc.add(buildParticipantsBlock(participations, mission));

            // Multi-affect : un seul bloc avec un tableau multi-rangées si plusieurs affectations actives
            if (mission.getAffectations() != null) {
                List<Affectation> actives = mission.getAffectations().stream()
                        .filter(a -> a.getStatut() == com.carfo.gestion_missions.enums.StatutAffectation.ACTIVE)
                        .toList();
                if (!actives.isEmpty()) {
                    doc.add(spacer(12f));
                    doc.add(buildAffectationsBlock(actives));
                }
            }

            doc.add(spacer(16f));
            doc.add(buildSignaturesBlock());

            doc.close();
            return out.toByteArray();
        } catch (Exception ex) {
            log.error("Échec génération PDF mission {}", idMission, ex);
            throw new BusinessRuleException("Impossible de générer la fiche PDF", ex);
        }
    }

    // ────────────────────────────────────────────────────────────────────
    // Header / Footer via PdfPageEvent (apparaît sur toutes les pages)
    // ────────────────────────────────────────────────────────────────────

    private class HeaderFooterEvent extends PdfPageEventHelper {
        private final Mission mission;
        private final com.carfo.gestion_missions.entity.AppConfig cfg;

        HeaderFooterEvent(Mission mission, com.carfo.gestion_missions.entity.AppConfig cfg) {
            this.mission = mission;
            this.cfg = cfg;
        }

        @Override
        public void onEndPage(PdfWriter writer, Document document) {
            try {
                drawHeader(writer);
                drawFooter(writer);
            } catch (Exception ex) {
                log.warn("Header/footer draw failed: {}", ex.getMessage());
            }
        }

        private void drawHeader(PdfWriter writer) throws Exception {
            PdfContentByte cb = writer.getDirectContent();
            float pageWidth = PageSize.A4.getWidth();

            // Bande verte d'en-tête (hauteur 90pt depuis le haut)
            cb.saveState();
            cb.setColorFill(CARFO_GREEN);
            cb.rectangle(0, PageSize.A4.getHeight() - 90, pageWidth, 90);
            cb.fill();
            // Fine bande or sous la bande verte
            cb.setColorFill(GOLD);
            cb.rectangle(0, PageSize.A4.getHeight() - 93, pageWidth, 3);
            cb.fill();
            cb.restoreState();

            // En-tête 3 colonnes : raison sociale (gauche) · logo (centre) · pays+devise+adresse (droite)
            PdfPTable headerTable = new PdfPTable(new float[]{ 3f, 1.4f, 3f });
            headerTable.setTotalWidth(pageWidth - 84f);

            // Gauche : raison sociale
            PdfPCell nameCell = new PdfPCell();
            nameCell.setBorder(Rectangle.NO_BORDER);
            nameCell.setVerticalAlignment(Element.ALIGN_MIDDLE);
            nameCell.setPaddingTop(8f);
            Paragraph nom = new Paragraph(cfg.getInstitutionNom().toUpperCase(),
                    FontFactory.getFont(FontFactory.HELVETICA_BOLD, 11, Color.WHITE));
            nom.setAlignment(Element.ALIGN_LEFT);
            nameCell.addElement(nom);
            headerTable.addCell(nameCell);

            // Centre : logo
            PdfPCell logoCell = new PdfPCell();
            logoCell.setBorder(Rectangle.NO_BORDER);
            logoCell.setVerticalAlignment(Element.ALIGN_MIDDLE);
            logoCell.setHorizontalAlignment(Element.ALIGN_CENTER);
            logoCell.setPaddingTop(6f);
            logoCell.setPaddingBottom(6f);
            try (InputStream is = new ClassPathResource("static/images/carfo-logo.png").getInputStream()) {
                byte[] bytes = is.readAllBytes();
                Image logo = Image.getInstance(bytes);
                logo.scaleToFit(58f, 58f);
                logo.setAlignment(Image.ALIGN_CENTER);
                logoCell.addElement(logo);
            } catch (Exception ignored) {
                Phrase fallback = new Phrase("CARFO", FontFactory.getFont(FontFactory.HELVETICA_BOLD, 16, Color.WHITE));
                logoCell.addElement(fallback);
            }
            headerTable.addCell(logoCell);

            // Droite : pays · devise · adresse
            PdfPCell orgCell = new PdfPCell();
            orgCell.setBorder(Rectangle.NO_BORDER);
            orgCell.setVerticalAlignment(Element.ALIGN_MIDDLE);
            orgCell.setPaddingTop(8f);

            Paragraph p1 = new Paragraph(cfg.getInstitutionPays(),
                    FontFactory.getFont(FontFactory.HELVETICA_BOLD, 10, Color.WHITE));
            p1.setAlignment(Element.ALIGN_RIGHT);
            orgCell.addElement(p1);

            Paragraph p2 = new Paragraph(cfg.getInstitutionDevise(),
                    FontFactory.getFont(FontFactory.HELVETICA_OBLIQUE, 8, new Color(220, 252, 231)));
            p2.setAlignment(Element.ALIGN_RIGHT);
            orgCell.addElement(p2);

            Paragraph p4 = new Paragraph(cfg.getInstitutionAdresse(),
                    FontFactory.getFont(FontFactory.HELVETICA, 8, new Color(220, 252, 231)));
            p4.setAlignment(Element.ALIGN_RIGHT);
            p4.setSpacingBefore(4f);
            orgCell.addElement(p4);

            headerTable.addCell(orgCell);
            headerTable.writeSelectedRows(0, -1, 42f, PageSize.A4.getHeight() - 10, cb);
        }

        private void drawFooter(PdfWriter writer) throws Exception {
            PdfContentByte cb = writer.getDirectContent();
            float pageWidth = PageSize.A4.getWidth();

            // Ligne fine de séparation
            cb.saveState();
            cb.setColorStroke(INK_200);
            cb.setLineWidth(0.5f);
            cb.moveTo(42f, 50f);
            cb.lineTo(pageWidth - 42f, 50f);
            cb.stroke();
            cb.restoreState();

            String ref = mission.getReference() != null ? mission.getReference() : ("MIS-" + mission.getIdMission());

            // Footer : 3 colonnes — gauche (réf doc), centre (mention), droite (page)
            PdfPTable footer = new PdfPTable(new float[]{ 2f, 3f, 2f });
            footer.setTotalWidth(pageWidth - 84f);

            PdfPCell left = new PdfPCell(new Phrase("Réf. " + ref,
                    FontFactory.getFont(FontFactory.HELVETICA_BOLD, 7, INK_500)));
            left.setBorder(Rectangle.NO_BORDER);
            left.setHorizontalAlignment(Element.ALIGN_LEFT);
            footer.addCell(left);

            PdfPCell center = new PdfPCell(new Phrase(
                    cfg.getInstitutionSigle() + " — Système de gestion des missions  •  Document généré le "
                            + LocalDate.now().format(DATE_FR),
                    FontFactory.getFont(FontFactory.HELVETICA, 7, INK_500)));
            center.setBorder(Rectangle.NO_BORDER);
            center.setHorizontalAlignment(Element.ALIGN_CENTER);
            footer.addCell(center);

            PdfPCell right = new PdfPCell(new Phrase(
                    "Page " + writer.getPageNumber(),
                    FontFactory.getFont(FontFactory.HELVETICA_BOLD, 7, INK_500)));
            right.setBorder(Rectangle.NO_BORDER);
            right.setHorizontalAlignment(Element.ALIGN_RIGHT);
            footer.addCell(right);

            footer.writeSelectedRows(0, -1, 42f, 42f, cb);
        }
    }

    // ────────────────────────────────────────────────────────────────────
    // Sections de contenu
    // ────────────────────────────────────────────────────────────────────

    /** Badge "FICHE DE DEMANDE DE MISSION · MIS-2026-NNN" centré, fond vert clair. */
    private PdfPTable buildReferenceBadge(Mission mission) {
        String ref = mission.getReference() != null ? mission.getReference() : ("MIS-" + mission.getIdMission());

        PdfPTable wrapper = new PdfPTable(1);
        wrapper.setWidthPercentage(100);

        PdfPCell badge = new PdfPCell();
        badge.setBackgroundColor(CARFO_GREEN_LIGHT);
        badge.setBorder(Rectangle.LEFT);
        badge.setBorderColor(CARFO_GREEN);
        badge.setBorderWidth(3f);
        badge.setPadding(10f);
        badge.setPaddingLeft(14f);

        Paragraph p = new Paragraph();
        p.add(new Chunk("FICHE DE DEMANDE DE MISSION   ",
                FontFactory.getFont(FontFactory.HELVETICA_BOLD, 10, CARFO_GREEN_DEEP)));
        p.add(new Chunk("·   " + ref,
                FontFactory.getFont(FontFactory.HELVETICA_BOLD, 10, GOLD)));
        badge.addElement(p);

        wrapper.addCell(badge);
        return wrapper;
    }

    private Paragraph buildTitleBlock(Mission mission) {
        Paragraph title = new Paragraph();
        title.setAlignment(Element.ALIGN_LEFT);
        title.setSpacingBefore(8f);

        Chunk h1 = new Chunk(safe(mission.getObjetMission()),
                FontFactory.getFont(FontFactory.HELVETICA_BOLD, 17, INK_900));
        title.add(h1);
        title.add(Chunk.NEWLINE);

        Chunk meta = new Chunk("Statut : " + mission.getStatut(),
                FontFactory.getFont(FontFactory.HELVETICA, 9, INK_500));
        title.add(meta);

        return title;
    }

    private PdfPTable buildInfoTable(Mission mission) {
        PdfPTable section = new PdfPTable(1);
        section.setWidthPercentage(100);
        section.addCell(sectionTitle("Informations générales"));

        PdfPTable table = new PdfPTable(new float[]{ 1f, 2f, 1f, 2f });
        table.setWidthPercentage(100);
        table.setSpacingBefore(6f);

        long durationDays = Math.max(1,
                java.time.temporal.ChronoUnit.DAYS.between(mission.getDateDebut(), mission.getDateFin()) + 1);

        String chefLabel = "—";
        if (mission.getChefMission() != null) {
            var chef = mission.getChefMission();
            chefLabel = safe(chef.getPrenom()) + " " + safe(chef.getNom())
                    + (chef.getMatricule() != null ? " (" + chef.getMatricule() + ")" : "");
        }

        addLabelValue(table, "Direction",       safe(mission.getDirection() != null ? mission.getDirection().getNomDirection() : null));
        addLabelValue(table, "Chef de mission", chefLabel);
        addLabelValue(table, "Lieu",            safe(mission.getLieu()));
        addLabelValue(table, "Durée",           durationDays + " jour(s)");
        addLabelValue(table, "Date début",      fmt(mission.getDateDebut()));
        addLabelValue(table, "Date fin",        fmt(mission.getDateFin()));
        addLabelValue(table, "Soumise le",      mission.getDateSoumission() != null
                ? mission.getDateSoumission().toLocalDate().format(DATE_FR) : "—");
        addLabelValue(table, "Référence",       mission.getReference() != null ? mission.getReference() : "—");

        PdfPCell wrapper = new PdfPCell();
        wrapper.setBorder(Rectangle.NO_BORDER);
        wrapper.addElement(table);
        section.addCell(wrapper);

        return section;
    }

    private PdfPTable buildParticipantsBlock(List<Participe> participations, Mission mission) {
        // Le chef de mission est exclu de la liste des participants (affiché à part dans le bloc infos).
        Long idChef = mission.getChefMission() != null ? mission.getChefMission().getIdAgent() : null;
        List<Participe> membres = participations.stream()
                .filter(p -> idChef == null || !idChef.equals(p.getAgent().getIdAgent()))
                .toList();

        PdfPTable section = new PdfPTable(1);
        section.setWidthPercentage(100);
        section.addCell(sectionTitle("Participants à la mission (" + membres.size() + ")"));

        if (membres.isEmpty()) {
            PdfPCell empty = new PdfPCell(new Phrase("Aucun participant déclaré pour cette mission.",
                    FontFactory.getFont(FontFactory.HELVETICA_OBLIQUE, 10, INK_500)));
            empty.setBorder(Rectangle.NO_BORDER);
            empty.setPaddingTop(10f);
            empty.setPaddingBottom(10f);
            section.addCell(empty);
            return section;
        }

        PdfPTable table = new PdfPTable(new float[]{ 0.5f, 1.2f, 2f, 1.3f });
        table.setWidthPercentage(100);
        table.setSpacingBefore(6f);
        table.setHeaderRows(1);

        addHeader(table, "N°");
        addHeader(table, "Matricule");
        addHeader(table, "Nom et prénom");
        addHeader(table, "Rôle");

        int idx = 1;
        for (Participe p : membres) {
            Color rowBg = (idx % 2 == 0) ? INK_50 : Color.WHITE;
            addBody(table, String.valueOf(idx), rowBg);
            addBody(table, safe(p.getAgent().getMatricule()), rowBg);
            addBody(table, safe(p.getAgent().getPrenom()) + " " + safe(p.getAgent().getNom()), rowBg);
            addBody(table, safe(p.getRoleMission()), rowBg);
            idx++;
        }

        PdfPCell wrapper = new PdfPCell();
        wrapper.setBorder(Rectangle.NO_BORDER);
        wrapper.addElement(table);
        section.addCell(wrapper);
        return section;
    }

    /** Tableau unique listant toutes les affectations actives (plus propre que N blocs). */
    private PdfPTable buildAffectationsBlock(List<Affectation> actives) {
        PdfPTable section = new PdfPTable(1);
        section.setWidthPercentage(100);
        section.addCell(sectionTitle("Affectations chauffeur(s) + véhicule(s) — " + actives.size()));

        PdfPTable table = new PdfPTable(new float[]{ 0.4f, 1.8f, 1.2f, 1.6f, 1.2f });
        table.setWidthPercentage(100);
        table.setSpacingBefore(6f);
        table.setHeaderRows(1);

        addHeader(table, "N°");
        addHeader(table, "Chauffeur");
        addHeader(table, "Matricule");
        addHeader(table, "Véhicule");
        addHeader(table, "Immat.");

        int idx = 1;
        for (Affectation a : actives) {
            Color rowBg = (idx % 2 == 0) ? INK_50 : Color.WHITE;
            addBody(table, String.valueOf(idx), rowBg);
            addBody(table, safe(a.getChauffeur().getPrenom()) + " " + safe(a.getChauffeur().getNom()), rowBg);
            addBody(table, safe(a.getChauffeur().getMatricule()), rowBg);
            addBody(table, safe(a.getVehicule().getMarque()) + " " + safe(a.getVehicule().getModele()), rowBg);
            addBody(table, safe(a.getVehicule().getImmatriculation()), rowBg);
            idx++;
        }

        PdfPCell wrapper = new PdfPCell();
        wrapper.setBorder(Rectangle.NO_BORDER);
        wrapper.addElement(table);
        section.addCell(wrapper);
        return section;
    }

    /** Bloc signatures : 3 colonnes — Chargé d'études / SG / Directeur Général. */
    private PdfPTable buildSignaturesBlock() {
        PdfPTable table = new PdfPTable(new float[]{ 1f, 1f, 1f });
        table.setWidthPercentage(100);
        table.setSpacingBefore(10f);
        table.setKeepTogether(true); // évite que le bloc signatures soit coupé sur 2 pages

        table.addCell(signatureCell("Le Chargé d'études"));
        table.addCell(signatureCell("La Secrétaire Générale"));
        table.addCell(signatureCell("Le Directeur Général"));

        return table;
    }

    private PdfPCell signatureCell(String role) {
        PdfPCell cell = new PdfPCell();
        cell.setBorder(Rectangle.NO_BORDER);
        cell.setPaddingTop(6f);
        cell.setPaddingBottom(6f);
        cell.setHorizontalAlignment(Element.ALIGN_CENTER);

        Paragraph roleP = new Paragraph(role,
                FontFactory.getFont(FontFactory.HELVETICA_BOLD, 9, INK_700));
        roleP.setAlignment(Element.ALIGN_CENTER);
        cell.addElement(roleP);

        Paragraph dateP = new Paragraph("Date et signature",
                FontFactory.getFont(FontFactory.HELVETICA_OBLIQUE, 7, INK_400));
        dateP.setAlignment(Element.ALIGN_CENTER);
        dateP.setSpacingBefore(2f);
        cell.addElement(dateP);

        // Placeholder zone signature : encadré vide
        PdfPTable box = new PdfPTable(1);
        box.setWidthPercentage(80);
        box.setSpacingBefore(4f);
        PdfPCell boxCell = new PdfPCell(new Phrase(" "));
        boxCell.setFixedHeight(48f);
        boxCell.setBorder(Rectangle.BOX);
        boxCell.setBorderColor(INK_200);
        boxCell.setBorderWidth(0.5f);
        box.addCell(boxCell);
        cell.addElement(box);

        return cell;
    }

    // ────────────────────────────────────────────────────────────────────
    // Helpers cellules
    // ────────────────────────────────────────────────────────────────────

    private PdfPCell sectionTitle(String text) {
        PdfPCell cell = new PdfPCell(new Phrase(text.toUpperCase(),
                FontFactory.getFont(FontFactory.HELVETICA_BOLD, 10, CARFO_GREEN_DEEP)));
        cell.setBackgroundColor(CARFO_GREEN_LIGHT);
        cell.setBorder(Rectangle.LEFT);
        cell.setBorderColor(CARFO_GREEN);
        cell.setBorderWidth(3f);
        cell.setPadding(8f);
        cell.setPaddingLeft(12f);
        return cell;
    }

    private void addLabelValue(PdfPTable table, String label, String value) {
        PdfPCell labelCell = new PdfPCell(new Phrase(label.toUpperCase(),
                FontFactory.getFont(FontFactory.HELVETICA_BOLD, 7, INK_500)));
        labelCell.setBorder(Rectangle.NO_BORDER);
        labelCell.setBackgroundColor(INK_100);
        labelCell.setPadding(8f);
        labelCell.setVerticalAlignment(Element.ALIGN_MIDDLE);
        table.addCell(labelCell);

        PdfPCell valueCell = new PdfPCell(new Phrase(value,
                FontFactory.getFont(FontFactory.HELVETICA_BOLD, 10, INK_900)));
        valueCell.setBorder(Rectangle.BOTTOM);
        valueCell.setBorderColor(INK_200);
        valueCell.setBorderWidth(0.5f);
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

    private void addBody(PdfPTable table, String value, Color background) {
        PdfPCell cell = new PdfPCell(new Phrase(value,
                FontFactory.getFont(FontFactory.HELVETICA, 9, INK_900)));
        cell.setBackgroundColor(background);
        cell.setPadding(7f);
        cell.setBorder(Rectangle.BOTTOM);
        cell.setBorderColor(INK_200);
        cell.setBorderWidth(0.5f);
        table.addCell(cell);
    }

    /** Cellule "Rôle" qui met le chef en évidence avec un badge or. */
    private void addRoleCell(PdfPTable table, String role, boolean estChef, Color background) {
        if (estChef) {
            Phrase ph = new Phrase();
            ph.add(new Chunk(role + "   ",
                    FontFactory.getFont(FontFactory.HELVETICA, 9, INK_900)));
            // Badge "CHEF" sur fond or — on simule un fond via setBackground sur le Chunk
            Chunk chef = new Chunk(" CHEF ",
                    FontFactory.getFont(FontFactory.HELVETICA_BOLD, 7, Color.WHITE));
            chef.setBackground(GOLD, 2f, 1f, 2f, 1.5f);
            ph.add(chef);
            PdfPCell cell = new PdfPCell(ph);
            cell.setBackgroundColor(background);
            cell.setPadding(7f);
            cell.setBorder(Rectangle.BOTTOM);
            cell.setBorderColor(INK_200);
            cell.setBorderWidth(0.5f);
            table.addCell(cell);
        } else {
            addBody(table, role, background);
        }
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
