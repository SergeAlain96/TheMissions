package com.carfo.gestion_missions.service;

import com.lowagie.text.Chunk;
import com.lowagie.text.Document;
import com.lowagie.text.Element;
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
import java.util.Map;

/**
 * Export du rapport statistique en PDF (synthèse visuelle) et CSV (données brutes).
 * Réutilise les données calculées par {@link DashboardService#getStatistics(Integer)}.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class StatistiquesExportService {

    private static final Color CARFO_GREEN       = new Color(22, 163, 74);
    private static final Color CARFO_GREEN_DEEP  = new Color(20, 83, 45);
    private static final Color CARFO_GREEN_LIGHT = new Color(236, 253, 243);
    private static final Color INK_900           = new Color(15, 23, 42);
    private static final Color INK_500           = new Color(100, 116, 139);
    private static final Color INK_200           = new Color(226, 232, 240);
    private static final Color INK_100           = new Color(241, 245, 249);
    private static final Color INK_50            = new Color(248, 250, 252);

    private static final DateTimeFormatter DATE_FR =
            DateTimeFormatter.ofPattern("dd MMMM yyyy", Locale.FRENCH);

    private static final String[] MOIS = {
            "Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
            "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"
    };

    private final DashboardService dashboardService;
    private final AppConfigService appConfigService;

    // ────────────────────────────────────────────────────────────────────
    // PDF
    // ────────────────────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public byte[] exporterPdf(Integer year) {
        Map<String, Object> stats = dashboardService.getStatistics(year);
        int annee = (Integer) stats.get("year");

        try (ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            Document doc = new Document(PageSize.A4, 42f, 42f, 50f, 60f);
            PdfWriter.getInstance(doc, out);
            doc.open();

            doc.add(buildHeader(annee));
            doc.add(spacer(14f));
            doc.add(buildSyntheseKpi(stats));
            doc.add(spacer(14f));
            doc.add(buildRessources(stats));
            doc.add(spacer(14f));
            doc.add(buildMissionsParDirection(stats));
            doc.add(spacer(14f));
            doc.add(buildMissionsParMois(stats));
            doc.add(spacer(14f));
            doc.add(buildTopLieux(stats));
            doc.add(spacer(14f));
            doc.add(buildChauffeurStats(stats));
            doc.add(spacer(14f));
            doc.add(buildVehiculeStats(stats));
            doc.add(spacer(18f));
            doc.add(buildFooter());

            doc.close();
            return out.toByteArray();
        } catch (Exception ex) {
            log.error("Échec génération PDF statistiques pour {}", year, ex);
            throw new RuntimeException("Impossible de générer le rapport PDF", ex);
        }
    }

    private PdfPTable buildHeader(int annee) throws Exception {
        var cfg = appConfigService.get();
        PdfPTable table = new PdfPTable(new float[]{ 1f, 4f });
        table.setWidthPercentage(100);

        PdfPCell logoCell = new PdfPCell();
        logoCell.setBorder(Rectangle.NO_BORDER);
        logoCell.setVerticalAlignment(Element.ALIGN_MIDDLE);
        try (InputStream is = new ClassPathResource("static/images/carfo-logo.png").getInputStream()) {
            byte[] bytes = is.readAllBytes();
            Image logo = Image.getInstance(bytes);
            logo.scaleToFit(60f, 60f);
            logoCell.addElement(logo);
        } catch (Exception ignored) {
            logoCell.addElement(new Phrase(cfg.getInstitutionSigle(),
                    FontFactory.getFont(FontFactory.HELVETICA_BOLD, 16, CARFO_GREEN_DEEP)));
        }
        table.addCell(logoCell);

        PdfPCell orgCell = new PdfPCell();
        orgCell.setBorder(Rectangle.NO_BORDER);
        orgCell.setVerticalAlignment(Element.ALIGN_MIDDLE);
        Paragraph p1 = new Paragraph(cfg.getInstitutionPays(),
                FontFactory.getFont(FontFactory.HELVETICA_BOLD, 9, INK_500));
        p1.setAlignment(Element.ALIGN_RIGHT);
        orgCell.addElement(p1);
        Paragraph p2 = new Paragraph(cfg.getInstitutionNom(),
                FontFactory.getFont(FontFactory.HELVETICA_BOLD, 10, CARFO_GREEN_DEEP));
        p2.setAlignment(Element.ALIGN_RIGHT);
        orgCell.addElement(p2);
        Paragraph p3 = new Paragraph("RAPPORT STATISTIQUE ANNUEL — " + annee,
                FontFactory.getFont(FontFactory.HELVETICA_BOLD, 14, CARFO_GREEN));
        p3.setAlignment(Element.ALIGN_RIGHT);
        p3.setSpacingBefore(6f);
        orgCell.addElement(p3);
        table.addCell(orgCell);

        // Bandeau vert de séparation
        PdfPCell band = new PdfPCell();
        band.setColspan(2);
        band.setBackgroundColor(CARFO_GREEN);
        band.setFixedHeight(3f);
        band.setBorder(Rectangle.NO_BORDER);
        table.addCell(band);

        return table;
    }

    private PdfPTable buildSyntheseKpi(Map<String, Object> stats) {
        PdfPTable section = new PdfPTable(1);
        section.setWidthPercentage(100);
        section.addCell(sectionTitle("Synthèse"));

        PdfPTable grid = new PdfPTable(4);
        grid.setWidthPercentage(100);
        grid.setSpacingBefore(6f);
        addKpiCell(grid, "Total missions",  asLong(stats.get("totalMissions")));
        addKpiCell(grid, "Validées",        asLong(stats.get("missionsValidated")));
        addKpiCell(grid, "En attente",      asLong(stats.get("missionsPending")));
        addKpiCell(grid, "Annulées",        asLong(stats.get("missionsCancelled")));

        PdfPCell wrap = new PdfPCell();
        wrap.setBorder(Rectangle.NO_BORDER);
        wrap.addElement(grid);
        section.addCell(wrap);
        return section;
    }

    @SuppressWarnings("unchecked")
    private PdfPTable buildRessources(Map<String, Object> stats) {
        PdfPTable section = new PdfPTable(1);
        section.setWidthPercentage(100);
        section.addCell(sectionTitle("Ressources actuelles"));

        Map<String, Object> r = (Map<String, Object>) stats.getOrDefault("ressources", Map.of());
        PdfPTable t = new PdfPTable(new float[]{ 1f, 2f, 1f, 2f });
        t.setWidthPercentage(100);
        t.setSpacingBefore(6f);
        addLabelValue(t, "Agents actifs",        String.valueOf(asLong(r.get("totalAgents"))));
        addLabelValue(t, "Chauffeurs",           String.valueOf(asLong(r.get("totalChauffeurs"))));
        addLabelValue(t, "Véhicules disponibles", String.valueOf(asLong(r.get("vehiculesDisponibles"))));
        addLabelValue(t, " ", " ");
        PdfPCell wrap = new PdfPCell();
        wrap.setBorder(Rectangle.NO_BORDER);
        wrap.addElement(t);
        section.addCell(wrap);
        return section;
    }

    @SuppressWarnings("unchecked")
    private PdfPTable buildMissionsParDirection(Map<String, Object> stats) {
        PdfPTable section = new PdfPTable(1);
        section.setWidthPercentage(100);
        section.addCell(sectionTitle("Missions par direction"));

        List<Map<String, Object>> rows =
                (List<Map<String, Object>>) stats.getOrDefault("missionsByDirection", List.of());
        PdfPTable t = new PdfPTable(new float[]{ 0.5f, 3f, 1f });
        t.setWidthPercentage(100);
        t.setSpacingBefore(6f);
        t.setHeaderRows(1);
        addHeader(t, "N°"); addHeader(t, "Direction"); addHeader(t, "Missions");
        int idx = 1;
        for (Map<String, Object> row : rows) {
            Color bg = (idx % 2 == 0) ? INK_50 : Color.WHITE;
            addBody(t, String.valueOf(idx), bg);
            addBody(t, String.valueOf(row.get("direction")), bg);
            addBody(t, String.valueOf(asLong(row.get("count"))), bg);
            idx++;
        }
        if (rows.isEmpty()) emptyRow(t, 3, "Aucune mission cette année.");
        PdfPCell wrap = new PdfPCell();
        wrap.setBorder(Rectangle.NO_BORDER);
        wrap.addElement(t);
        section.addCell(wrap);
        return section;
    }

    private PdfPTable buildMissionsParMois(Map<String, Object> stats) {
        PdfPTable section = new PdfPTable(1);
        section.setWidthPercentage(100);
        section.addCell(sectionTitle("Missions par mois"));

        Object raw = stats.get("missionsByMonth");
        long[] byMonth = toLongArray12(raw);
        PdfPTable t = new PdfPTable(new float[]{ 0.5f, 2.5f, 1f });
        t.setWidthPercentage(100);
        t.setSpacingBefore(6f);
        t.setHeaderRows(1);
        addHeader(t, "N°"); addHeader(t, "Mois"); addHeader(t, "Missions");
        for (int i = 0; i < 12; i++) {
            Color bg = (i % 2 == 0) ? Color.WHITE : INK_50;
            addBody(t, String.valueOf(i + 1), bg);
            addBody(t, MOIS[i], bg);
            addBody(t, String.valueOf(byMonth[i]), bg);
        }
        PdfPCell wrap = new PdfPCell();
        wrap.setBorder(Rectangle.NO_BORDER);
        wrap.addElement(t);
        section.addCell(wrap);
        return section;
    }

    @SuppressWarnings("unchecked")
    private PdfPTable buildTopLieux(Map<String, Object> stats) {
        PdfPTable section = new PdfPTable(1);
        section.setWidthPercentage(100);
        section.addCell(sectionTitle("Top 5 destinations"));

        List<Map<String, Object>> rows =
                (List<Map<String, Object>>) stats.getOrDefault("topLieux", List.of());
        PdfPTable t = new PdfPTable(new float[]{ 0.5f, 3f, 1f });
        t.setWidthPercentage(100);
        t.setSpacingBefore(6f);
        t.setHeaderRows(1);
        addHeader(t, "Rang"); addHeader(t, "Lieu"); addHeader(t, "Missions");
        int idx = 1;
        for (Map<String, Object> row : rows) {
            Color bg = (idx % 2 == 0) ? INK_50 : Color.WHITE;
            addBody(t, String.valueOf(idx), bg);
            addBody(t, String.valueOf(row.get("lieu")), bg);
            addBody(t, String.valueOf(asLong(row.get("count"))), bg);
            idx++;
        }
        if (rows.isEmpty()) emptyRow(t, 3, "Aucune destination cette année.");
        PdfPCell wrap = new PdfPCell();
        wrap.setBorder(Rectangle.NO_BORDER);
        wrap.addElement(t);
        section.addCell(wrap);
        return section;
    }

    @SuppressWarnings("unchecked")
    private PdfPTable buildChauffeurStats(Map<String, Object> stats) {
        PdfPTable section = new PdfPTable(1);
        section.setWidthPercentage(100);
        section.addCell(sectionTitle("Activité des chauffeurs"));

        Map<String, Object> cs = (Map<String, Object>) stats.getOrDefault("chauffeurStats", Map.of());
        List<Map<String, Object>> rows =
                (List<Map<String, Object>>) cs.getOrDefault("missionsPerChauffeur", List.of());
        PdfPTable t = new PdfPTable(new float[]{ 0.5f, 1.2f, 2f, 1f });
        t.setWidthPercentage(100);
        t.setSpacingBefore(6f);
        t.setHeaderRows(1);
        addHeader(t, "N°"); addHeader(t, "Matricule"); addHeader(t, "Nom"); addHeader(t, "Missions");
        int idx = 1;
        for (Map<String, Object> row : rows) {
            Color bg = (idx % 2 == 0) ? INK_50 : Color.WHITE;
            addBody(t, String.valueOf(idx), bg);
            addBody(t, String.valueOf(row.get("matricule")), bg);
            addBody(t, row.get("prenom") + " " + row.get("nom"), bg);
            addBody(t, String.valueOf(asLong(row.get("missions"))), bg);
            idx++;
        }
        if (rows.isEmpty()) emptyRow(t, 4, "Aucun chauffeur actif.");
        PdfPCell wrap = new PdfPCell();
        wrap.setBorder(Rectangle.NO_BORDER);
        wrap.addElement(t);
        section.addCell(wrap);
        return section;
    }

    @SuppressWarnings("unchecked")
    private PdfPTable buildVehiculeStats(Map<String, Object> stats) {
        PdfPTable section = new PdfPTable(1);
        section.setWidthPercentage(100);
        section.addCell(sectionTitle("Activité des véhicules"));

        Map<String, Object> vs = (Map<String, Object>) stats.getOrDefault("vehiculeStats", Map.of());
        List<Map<String, Object>> rows =
                (List<Map<String, Object>>) vs.getOrDefault("missionsPerVehicule", List.of());
        PdfPTable t = new PdfPTable(new float[]{ 0.5f, 1.5f, 1.5f, 1.5f, 1f });
        t.setWidthPercentage(100);
        t.setSpacingBefore(6f);
        t.setHeaderRows(1);
        addHeader(t, "N°"); addHeader(t, "Immat.");
        addHeader(t, "Marque"); addHeader(t, "Modèle"); addHeader(t, "Missions");
        int idx = 1;
        for (Map<String, Object> row : rows) {
            Color bg = (idx % 2 == 0) ? INK_50 : Color.WHITE;
            addBody(t, String.valueOf(idx), bg);
            addBody(t, String.valueOf(row.get("immatriculation")), bg);
            addBody(t, String.valueOf(row.get("marque")), bg);
            addBody(t, String.valueOf(row.get("modele")), bg);
            addBody(t, String.valueOf(asLong(row.get("missions"))), bg);
            idx++;
        }
        if (rows.isEmpty()) emptyRow(t, 5, "Aucun véhicule actif.");
        PdfPCell wrap = new PdfPCell();
        wrap.setBorder(Rectangle.NO_BORDER);
        wrap.addElement(t);
        section.addCell(wrap);
        return section;
    }

    private PdfPTable buildFooter() {
        PdfPTable t = new PdfPTable(1);
        t.setWidthPercentage(100);
        PdfPCell cell = new PdfPCell();
        cell.setBorder(Rectangle.TOP);
        cell.setBorderColor(INK_200);
        cell.setPaddingTop(8f);
        Paragraph p = new Paragraph("Document généré le " + LocalDate.now().format(DATE_FR)
                + " — CARFO, Système de gestion des missions",
                FontFactory.getFont(FontFactory.HELVETICA_OBLIQUE, 8, INK_500));
        p.setAlignment(Element.ALIGN_CENTER);
        cell.addElement(p);
        t.addCell(cell);
        return t;
    }

    // ────────────────────────────────────────────────────────────────────
    // CSV
    // ────────────────────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    @SuppressWarnings("unchecked")
    public byte[] exporterCsv(Integer year) {
        Map<String, Object> stats = dashboardService.getStatistics(year);
        int annee = (Integer) stats.get("year");

        StringBuilder sb = new StringBuilder();
        sb.append("Rapport statistique annuel CARFO\n");
        sb.append("Année;").append(annee).append("\n");
        sb.append("Généré le;").append(LocalDate.now().format(DATE_FR)).append("\n\n");

        sb.append("Synthèse\n");
        sb.append("Indicateur;Valeur\n");
        sb.append("Total missions;").append(asLong(stats.get("totalMissions"))).append("\n");
        sb.append("Validées;").append(asLong(stats.get("missionsValidated"))).append("\n");
        sb.append("Annulées;").append(asLong(stats.get("missionsCancelled"))).append("\n");
        sb.append("Clôturées;").append(asLong(stats.get("missionsClosed"))).append("\n");
        sb.append("En attente;").append(asLong(stats.get("missionsPending"))).append("\n\n");

        Map<String, Object> ressources = (Map<String, Object>) stats.getOrDefault("ressources", Map.of());
        sb.append("Ressources\n");
        sb.append("Indicateur;Valeur\n");
        sb.append("Agents actifs;").append(asLong(ressources.get("totalAgents"))).append("\n");
        sb.append("Chauffeurs;").append(asLong(ressources.get("totalChauffeurs"))).append("\n");
        sb.append("Véhicules disponibles;").append(asLong(ressources.get("vehiculesDisponibles"))).append("\n\n");

        sb.append("Missions par direction\n");
        sb.append("Direction;Missions\n");
        for (Map<String, Object> row : (List<Map<String, Object>>) stats.getOrDefault("missionsByDirection", List.of())) {
            sb.append(csvField(String.valueOf(row.get("direction")))).append(';')
              .append(asLong(row.get("count"))).append('\n');
        }
        sb.append('\n');

        sb.append("Missions par mois\n");
        sb.append("Mois;Missions\n");
        long[] byMonth = toLongArray12(stats.get("missionsByMonth"));
        for (int i = 0; i < 12; i++) {
            sb.append(MOIS[i]).append(';').append(byMonth[i]).append('\n');
        }
        sb.append('\n');

        sb.append("Top destinations\n");
        sb.append("Rang;Lieu;Missions\n");
        int rank = 1;
        for (Map<String, Object> row : (List<Map<String, Object>>) stats.getOrDefault("topLieux", List.of())) {
            sb.append(rank++).append(';')
              .append(csvField(String.valueOf(row.get("lieu")))).append(';')
              .append(asLong(row.get("count"))).append('\n');
        }
        sb.append('\n');

        Map<String, Object> cs = (Map<String, Object>) stats.getOrDefault("chauffeurStats", Map.of());
        sb.append("Activité chauffeurs\n");
        sb.append("Matricule;Nom complet;Missions\n");
        for (Map<String, Object> row : (List<Map<String, Object>>) cs.getOrDefault("missionsPerChauffeur", List.of())) {
            sb.append(csvField(String.valueOf(row.get("matricule")))).append(';')
              .append(csvField(row.get("prenom") + " " + row.get("nom"))).append(';')
              .append(asLong(row.get("missions"))).append('\n');
        }
        sb.append('\n');

        Map<String, Object> vs = (Map<String, Object>) stats.getOrDefault("vehiculeStats", Map.of());
        sb.append("Activité véhicules\n");
        sb.append("Immatriculation;Marque;Modèle;Missions\n");
        for (Map<String, Object> row : (List<Map<String, Object>>) vs.getOrDefault("missionsPerVehicule", List.of())) {
            sb.append(csvField(String.valueOf(row.get("immatriculation")))).append(';')
              .append(csvField(String.valueOf(row.get("marque")))).append(';')
              .append(csvField(String.valueOf(row.get("modele")))).append(';')
              .append(asLong(row.get("missions"))).append('\n');
        }

        // BOM UTF-8 pour qu'Excel détecte correctement l'encodage avec accents français
        byte[] bom = new byte[]{ (byte)0xEF, (byte)0xBB, (byte)0xBF };
        byte[] body = sb.toString().getBytes(java.nio.charset.StandardCharsets.UTF_8);
        byte[] out = new byte[bom.length + body.length];
        System.arraycopy(bom, 0, out, 0, bom.length);
        System.arraycopy(body, 0, out, bom.length, body.length);
        return out;
    }

    // ────────────────────────────────────────────────────────────────────
    // Helpers
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

    private void addKpiCell(PdfPTable table, String label, long value) {
        PdfPCell cell = new PdfPCell();
        cell.setBorder(Rectangle.BOX);
        cell.setBorderColor(INK_200);
        cell.setPadding(10f);
        cell.setBackgroundColor(INK_50);
        Paragraph lbl = new Paragraph(label.toUpperCase(),
                FontFactory.getFont(FontFactory.HELVETICA_BOLD, 7, INK_500));
        cell.addElement(lbl);
        Paragraph val = new Paragraph(String.valueOf(value),
                FontFactory.getFont(FontFactory.HELVETICA_BOLD, 18, CARFO_GREEN_DEEP));
        val.setSpacingBefore(4f);
        cell.addElement(val);
        table.addCell(cell);
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
        table.addCell(valueCell);
    }

    private void addHeader(PdfPTable table, String label) {
        PdfPCell cell = new PdfPCell(new Phrase(label.toUpperCase(),
                FontFactory.getFont(FontFactory.HELVETICA_BOLD, 8, Color.WHITE)));
        cell.setBackgroundColor(CARFO_GREEN);
        cell.setPadding(6f);
        cell.setBorder(Rectangle.NO_BORDER);
        table.addCell(cell);
    }

    private void addBody(PdfPTable table, String value, Color bg) {
        PdfPCell cell = new PdfPCell(new Phrase(value == null ? "—" : value,
                FontFactory.getFont(FontFactory.HELVETICA, 9, INK_900)));
        cell.setBackgroundColor(bg);
        cell.setPadding(6f);
        cell.setBorder(Rectangle.BOTTOM);
        cell.setBorderColor(INK_200);
        cell.setBorderWidth(0.5f);
        table.addCell(cell);
    }

    private void emptyRow(PdfPTable table, int colspan, String text) {
        PdfPCell cell = new PdfPCell(new Phrase(text,
                FontFactory.getFont(FontFactory.HELVETICA_OBLIQUE, 9, INK_500)));
        cell.setColspan(colspan);
        cell.setBorder(Rectangle.NO_BORDER);
        cell.setPadding(8f);
        cell.setHorizontalAlignment(Element.ALIGN_CENTER);
        table.addCell(cell);
    }

    private Paragraph spacer(float height) {
        Paragraph p = new Paragraph(" ");
        p.setSpacingAfter(height);
        return p;
    }

    private String csvField(String s) {
        if (s == null) return "";
        // Échappe les ; et " selon RFC 4180 (séparateur ; pour Excel FR)
        if (s.contains(";") || s.contains("\"") || s.contains("\n")) {
            return "\"" + s.replace("\"", "\"\"") + "\"";
        }
        return s;
    }

    private long asLong(Object o) {
        if (o == null) return 0L;
        if (o instanceof Number n) return n.longValue();
        try { return Long.parseLong(String.valueOf(o)); } catch (Exception e) { return 0L; }
    }

    private long[] toLongArray12(Object raw) {
        long[] arr = new long[12];
        if (raw instanceof long[] l && l.length == 12) {
            System.arraycopy(l, 0, arr, 0, 12);
        } else if (raw instanceof int[] i) {
            for (int k = 0; k < 12 && k < i.length; k++) arr[k] = i[k];
        } else if (raw instanceof List<?> list) {
            for (int k = 0; k < 12 && k < list.size(); k++) arr[k] = asLong(list.get(k));
        }
        return arr;
    }
}
