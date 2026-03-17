package com.privod.platform.modules.specification.service;

import com.privod.platform.modules.specification.web.dto.ParsedSpecItemDto;
import org.junit.jupiter.api.Test;

import java.io.FileInputStream;
import java.io.IOException;
import java.io.InputStream;
import java.util.*;
import java.util.stream.Collectors;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Integration test for {@link SpecificationPdfParserService} against real ГОСТ PDFs.
 * <p>
 * Requires the test PDFs in ~/Downloads/.
 * If absent, the test is skipped automatically.
 */
class SpecificationPdfParserServiceTest {

    private static final String[] PDF_PATHS = {
            System.getProperty("user.home") + "/Downloads/30. 1218-Д00100.2_25-Р-АОВ1.1.pdf",
            System.getProperty("user.home") + "/Downloads/31. 1218-Д00100.2_25-Р-АОВ1.2 (от 27.02.2026).pdf",
            System.getProperty("user.home") + "/Downloads/22. 1218-Д00100.2_25-Р-ИТП (от 13.03.2026).pdf",
            System.getProperty("user.home") + "/Downloads/21. 1218-Д00100.2_25-Р-ОВ.pdf",
    };

    private static final String[] PDF_NAMES = {
            "АОВ1.1 (АБК)",
            "АОВ1.2 (Производственная часть)",
            "ИТП",
            "ОВ",
    };

    @Test
    void parseAllFourPdfs() throws IOException {
        SpecificationPdfParserService parser = new SpecificationPdfParserService();

        // Collect all items from all specs, tracking section dedup
        Map<String, List<ParsedSpecItemDto>> allSections = new LinkedHashMap<>();
        Map<String, Map<String, List<ParsedSpecItemDto>>> perPdfSections = new LinkedHashMap<>();

        int totalItems = 0;
        int totalPdfsFound = 0;

        for (int i = 0; i < PDF_PATHS.length; i++) {
            java.io.File file = new java.io.File(PDF_PATHS[i]);
            if (!file.exists()) {
                System.out.println("SKIP: PDF not found at " + PDF_PATHS[i]);
                continue;
            }
            totalPdfsFound++;

            List<ParsedSpecItemDto> items;
            try (InputStream is = new FileInputStream(file)) {
                items = parser.parsePdf(is);
            }

            System.out.println("\n" + "=".repeat(100));
            System.out.printf("=== PDF %d: %s — %d items ===%n", i + 1, PDF_NAMES[i], items.size());
            System.out.println("=".repeat(100));

            // Group by section
            Map<String, List<ParsedSpecItemDto>> bySection = items.stream()
                    .collect(Collectors.groupingBy(
                            it -> it.sectionName() != null ? it.sectionName() : "(без секции)",
                            LinkedHashMap::new,
                            Collectors.toList()));

            perPdfSections.put(PDF_NAMES[i], bySection);

            for (Map.Entry<String, List<ParsedSpecItemDto>> entry : bySection.entrySet()) {
                System.out.println("\n--- СЕКЦИЯ: " + entry.getKey() + " (" + entry.getValue().size() + " позиций) ---");
                for (ParsedSpecItemDto item : entry.getValue()) {
                    System.out.printf("  [%s] %-60s | type=%-10s | brand=%-30s | code=%-20s | mfg=%-25s | unit=%-6s | qty=%-6s | mass=%-8s | notes=%s%n",
                            pad(item.position(), 6),
                            truncate(item.name(), 60),
                            item.itemType(),
                            item.brand() != null ? truncate(item.brand(), 30) : "-",
                            item.productCode() != null ? truncate(item.productCode(), 20) : "-",
                            item.manufacturer() != null ? truncate(item.manufacturer(), 25) : "-",
                            item.unitOfMeasure(),
                            item.quantity(),
                            item.mass() != null ? item.mass() : "-",
                            item.notes() != null ? truncate(item.notes(), 50) : "-");
                }

                // Accumulate for dedup analysis
                allSections.computeIfAbsent(entry.getKey(), k -> new ArrayList<>()).addAll(entry.getValue());
            }

            totalItems += items.size();
        }

        if (totalPdfsFound == 0) {
            System.out.println("No PDFs found — skipping all assertions");
            return;
        }

        // ============ DEDUP ANALYSIS ============
        System.out.println("\n" + "=".repeat(100));
        System.out.println("=== ДЕДУПЛИКАЦИЯ: Анализ пересечения секций между спецификациями ===");
        System.out.println("=".repeat(100));

        for (Map.Entry<String, List<ParsedSpecItemDto>> entry : allSections.entrySet()) {
            String section = entry.getKey();
            List<ParsedSpecItemDto> sectionItems = entry.getValue();

            // Find which PDFs contributed to this section
            List<String> contributors = new ArrayList<>();
            for (Map.Entry<String, Map<String, List<ParsedSpecItemDto>>> pdfEntry : perPdfSections.entrySet()) {
                if (pdfEntry.getValue().containsKey(section)) {
                    contributors.add(pdfEntry.getKey() + " (" + pdfEntry.getValue().get(section).size() + " шт)");
                }
            }

            if (contributors.size() > 1) {
                System.out.printf("\n⚠ ДУБЛИРУЮЩИЙСЯ РАЗДЕЛ: \"%s\"%n", section);
                System.out.println("  Найден в: " + String.join(", ", contributors));
                System.out.println("  Всего позиций (суммарно): " + sectionItems.size());

                // Check for duplicate item names within the section
                Map<String, Long> nameCounts = sectionItems.stream()
                        .collect(Collectors.groupingBy(
                                it -> it.name().trim().toLowerCase(),
                                Collectors.counting()));
                List<String> duplicateNames = nameCounts.entrySet().stream()
                        .filter(e -> e.getValue() > 1)
                        .map(e -> e.getKey() + " (x" + e.getValue() + ")")
                        .collect(Collectors.toList());

                if (!duplicateNames.isEmpty()) {
                    System.out.println("  ДУБЛИКАТЫ по имени: " + duplicateNames.size());
                    duplicateNames.forEach(d -> System.out.println("    - " + d));
                } else {
                    System.out.println("  Дубликатов по имени нет — позиции уникальны");
                }
            }
        }

        // ============ FM SIMULATION ============
        System.out.println("\n" + "=".repeat(100));
        System.out.println("=== СИМУЛЯЦИЯ ОТПРАВКИ В ФМ ===");
        System.out.println("=".repeat(100));

        // Simulate what would happen if we push all 4 specs to FM in sequence
        Map<String, List<ParsedSpecItemDto>> fmSections = new LinkedHashMap<>();
        Map<String, Set<String>> fmItemNames = new LinkedHashMap<>();

        for (Map.Entry<String, Map<String, List<ParsedSpecItemDto>>> pdfEntry : perPdfSections.entrySet()) {
            String pdfName = pdfEntry.getKey();
            System.out.println("\nОбработка: " + pdfName);

            for (Map.Entry<String, List<ParsedSpecItemDto>> sectionEntry : pdfEntry.getValue().entrySet()) {
                String section = sectionEntry.getKey();
                List<ParsedSpecItemDto> items = sectionEntry.getValue();

                if (fmSections.containsKey(section)) {
                    System.out.printf("  Раздел \"%s\" уже существует в ФМ%n", truncate(section, 50));

                    // Check each item
                    Set<String> existingNames = fmItemNames.get(section);
                    int newCount = 0, dupCount = 0;
                    for (ParsedSpecItemDto item : items) {
                        String key = item.name().trim().toLowerCase();
                        if (existingNames.contains(key)) {
                            dupCount++;
                        } else {
                            newCount++;
                            existingNames.add(key);
                            fmSections.get(section).add(item);
                        }
                    }
                    System.out.printf("    → %d новых, %d дубликатов (пропущены)%n", newCount, dupCount);
                } else {
                    fmSections.put(section, new ArrayList<>(items));
                    Set<String> names = items.stream()
                            .map(it -> it.name().trim().toLowerCase())
                            .collect(Collectors.toCollection(HashSet::new));
                    fmItemNames.put(section, names);
                    System.out.printf("  Создан раздел \"%s\" с %d позициями%n", truncate(section, 50), items.size());
                }
            }
        }

        System.out.println("\n--- Итоговый ФМ ---");
        int totalFmItems = 0;
        for (Map.Entry<String, List<ParsedSpecItemDto>> entry : fmSections.entrySet()) {
            System.out.printf("  [%d шт] %s%n", entry.getValue().size(), entry.getKey());
            totalFmItems += entry.getValue().size();
        }
        System.out.printf("\nВсего разделов: %d, Всего позиций: %d%n", fmSections.size(), totalFmItems);

        // ============ FINAL SUMMARY ============
        System.out.println("\n" + "=".repeat(100));
        System.out.printf("ИТОГО: %d PDF файлов, %d позиций распаршено%n", totalPdfsFound, totalItems);
        System.out.println("=".repeat(100));
    }

    @Test
    void parseAov11Pdf() throws IOException {
        java.io.File file = new java.io.File(PDF_PATHS[0]);
        if (!file.exists()) {
            System.out.println("SKIP: PDF not found at " + PDF_PATHS[0]);
            return;
        }

        SpecificationPdfParserService parser = new SpecificationPdfParserService();
        List<ParsedSpecItemDto> items;

        try (InputStream is = new FileInputStream(file)) {
            items = parser.parsePdf(is);
        }

        System.out.println("=== Parsed " + items.size() + " items ===\n");

        // Print by section
        Map<String, List<ParsedSpecItemDto>> bySection = items.stream()
                .collect(Collectors.groupingBy(
                        it -> it.sectionName() != null ? it.sectionName() : "(без секции)",
                        java.util.LinkedHashMap::new,
                        Collectors.toList()));

        for (Map.Entry<String, List<ParsedSpecItemDto>> entry : bySection.entrySet()) {
            System.out.println("--- СЕКЦИЯ: " + entry.getKey() + " (" + entry.getValue().size() + " позиций) ---");
            for (ParsedSpecItemDto item : entry.getValue()) {
                System.out.printf("  [%s] %s | type=%s | brand=%s | code=%s | mfg=%s | unit=%s | qty=%s | mass=%s | notes=%s%n",
                        item.position(),
                        truncate(item.name(), 60),
                        item.itemType(),
                        item.brand() != null ? truncate(item.brand(), 30) : "-",
                        item.productCode() != null ? item.productCode() : "-",
                        item.manufacturer() != null ? truncate(item.manufacturer(), 30) : "-",
                        item.unitOfMeasure(),
                        item.quantity(),
                        item.mass() != null ? item.mass() : "-",
                        item.notes() != null ? truncate(item.notes(), 40) : "-");
            }
            System.out.println();
        }

        // Assertions
        assertFalse(items.isEmpty(), "Should parse at least some items");
        assertTrue(items.size() >= 30, "Expected at least 30 items, got " + items.size());

        // Check that section headers are detected (not parsed as items)
        boolean hasSection1AsItem = items.stream()
                .anyMatch(it -> "1".equals(it.position()) && it.name().contains("Приборы"));
        assertFalse(hasSection1AsItem,
                "Section header '1 Приборы и средства автоматизации' should NOT be an item");

        // Check sections are present
        long sectionCount = items.stream()
                .map(ParsedSpecItemDto::sectionName)
                .filter(s -> s != null)
                .distinct().count();
        assertTrue(sectionCount >= 3, "Expected at least 3 sections, got " + sectionCount);

        System.out.println("✓ All assertions passed: " + items.size() + " items, " + sectionCount + " sections");
    }

    /**
     * Tests parsing of the ИТП PDF, which has a spec table starting on page 15
     * (pages 1-14 are drawings/schematics) and uses position-less item format.
     */
    @Test
    void parseItpPdf() throws IOException {
        java.io.File file = new java.io.File(PDF_PATHS[2]); // ИТП
        if (!file.exists()) {
            System.out.println("SKIP: ИТП PDF not found at " + PDF_PATHS[2]);
            return;
        }

        SpecificationPdfParserService parser = new SpecificationPdfParserService();
        List<ParsedSpecItemDto> items;

        try (InputStream is = new FileInputStream(file)) {
            items = parser.parsePdf(is);
        }

        System.out.println("=== ИТП: Parsed " + items.size() + " items ===\n");

        // Print by section
        Map<String, List<ParsedSpecItemDto>> bySection = items.stream()
                .collect(Collectors.groupingBy(
                        it -> it.sectionName() != null ? it.sectionName() : "(без секции)",
                        java.util.LinkedHashMap::new,
                        Collectors.toList()));

        for (Map.Entry<String, List<ParsedSpecItemDto>> entry : bySection.entrySet()) {
            System.out.println("--- СЕКЦИЯ: " + entry.getKey() + " (" + entry.getValue().size() + " позиций) ---");
            for (ParsedSpecItemDto item : entry.getValue()) {
                System.out.printf("  [%s] %s | type=%s | brand=%s | unit=%s | qty=%s%n",
                        item.position(),
                        truncate(item.name(), 60),
                        item.itemType(),
                        item.brand() != null ? truncate(item.brand(), 25) : "-",
                        item.unitOfMeasure(),
                        item.quantity());
            }
            System.out.println();
        }

        // Assertions for ИТП
        assertFalse(items.isEmpty(), "Should parse at least some items from ИТП");
        assertTrue(items.size() >= 50, "Expected at least 50 items from ИТП, got " + items.size());

        // Check sections are present
        long sectionCount = items.stream()
                .map(ParsedSpecItemDto::sectionName)
                .filter(s -> s != null)
                .distinct().count();
        assertTrue(sectionCount >= 5, "Expected at least 5 sections, got " + sectionCount);

        // Check that equipment items are found (pumps, valves, etc.)
        boolean hasEquipment = items.stream().anyMatch(it -> "EQUIPMENT".equals(it.itemType()));
        assertTrue(hasEquipment, "Should have at least one EQUIPMENT item");

        // Check that material items are found (pipes, fittings, etc.)
        boolean hasMaterial = items.stream().anyMatch(it -> "MATERIAL".equals(it.itemType()));
        assertTrue(hasMaterial, "Should have at least one MATERIAL item");

        System.out.println("✓ ИТП assertions passed: " + items.size() + " items, " + sectionCount + " sections");
    }

    private static String truncate(String s, int max) {
        return s.length() > max ? s.substring(0, max) + "…" : s;
    }

    private static String pad(String s, int width) {
        if (s == null) return " ".repeat(width);
        return s.length() >= width ? s : s + " ".repeat(width - s.length());
    }
}
