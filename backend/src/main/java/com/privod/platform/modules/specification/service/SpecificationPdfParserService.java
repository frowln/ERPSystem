package com.privod.platform.modules.specification.service;

import com.privod.platform.modules.specification.web.dto.ParsedSpecItemDto;
import lombok.extern.slf4j.Slf4j;
import org.apache.pdfbox.Loader;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.pdmodel.PDPage;
import org.apache.pdfbox.text.PDFTextStripper;
import org.apache.pdfbox.text.TextPosition;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.io.IOException;
import java.io.InputStream;
import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.Collectors;
import java.util.stream.IntStream;

/**
 * Parses a Russian ГОСТ Р 21.1101 specification table from a PDF document.
 *
 * <p>Uses a {@link ColumnAwareStripper} that injects {@code \t} between text runs
 * separated by a gap ≥ 10 PDF points (~3.5 mm) to reliably detect table columns.
 *
 * <p>Detects section headers (e.g. "СИСТЕМА ОТОПЛЕНИЯ ЖИЛЫХ ПОМЕЩЕНИЙ") within
 * the spec body and annotates each item with its {@code sectionName} including
 * the abbreviation mapped from an engineering-discipline dictionary.
 */
@Service
@Slf4j
public class SpecificationPdfParserService {

    // ─── Units of measure ─────────────────────────────────────────────────────

    private static final Set<String> UNITS = Set.of(
            "шт.", "шт", "комп.", "комп", "м.", "м", "м2", "м²", "м3", "м³",
            "кг", "кг.", "т.", "т", "пог.м", "пог.м.", "пм", "л.", "л",
            "мп.", "мп", "пара", "пара.", "компл.", "компл", "уп.", "уп",
            "рул.", "рул", "лист", "лист.", "п.м", "п.м."
    );

    // ─── Position pattern ─────────────────────────────────────────────────────

    private static final Pattern POSITION_PATTERN = Pattern.compile(
            "^([А-ЯЁа-яёA-Za-z]?\\d{1,3}([.\\-][А-ЯЁа-яёa-zA-Z\\d]{1,3})?)\\s+(.*)",
            Pattern.DOTALL
    );

    // ─── Section abbreviation dictionary ──────────────────────────────────────
    // Ordered from more specific to less specific (LinkedHashMap preserves order).
    // Key = keyword substring to search in UPPERCASE section header.
    // Value = engineering abbreviation.

    private static final Map<String, String> SECTION_ABBR = new LinkedHashMap<>();

    static {
        // ИОС4 — Тепло/Вент/Кондиционирование
        SECTION_ABBR.put("ТЕПЛОВОЙ ПУНКТ",           "ИТП");
        SECTION_ABBR.put("ИНДИВИДУАЛЬНЫЙ ТЕПЛОВОЙ",  "ИТП");
        SECTION_ABBR.put("ИТП",                       "ИТП");
        SECTION_ABBR.put("ТЕПЛОВЫЧИСЛИТ",             "ИТП");
        SECTION_ABBR.put("ТЕПЛОМЕХАНИЧ",              "ТМ");
        SECTION_ABBR.put("ТЕПЛОВЫЕ СЕТИ",             "ТС");
        SECTION_ABBR.put("ТЕПЛОСНАБ",                 "ТС");
        SECTION_ABBR.put("ХОЛОДОСНАБ",                "ХС");
        SECTION_ABBR.put("КОНДИЦИОНИРОВ",             "ОВиК");
        SECTION_ABBR.put("ЧИЛЛЕР",                    "ХС");
        SECTION_ABBR.put("ОТОПЛ",                     "ОВ");
        SECTION_ABBR.put("ВЕНТИЛ",                    "ОВ");
        SECTION_ABBR.put("ВЫТЯЖН",                    "ОВ");
        SECTION_ABBR.put("ПРИТОЧН",                   "ОВ");
        SECTION_ABBR.put("ДЫМОУДАЛЕН",                "ДП");
        SECTION_ABBR.put("ПРОТИВОДЫМН",               "ДП");
        // ИОС2 — Водоснабжение
        SECTION_ABBR.put("ПРОТИВОПОЖАРНЫЙ ВОДОПРОВОД","ВПВ");
        SECTION_ABBR.put("ВНУТРЕННИЙ ПРОТИВОПОЖАРН",  "ВПВ");
        SECTION_ABBR.put("ПОЖАРНЫЙ ВОДОПРОВОД",       "ВПВ");
        SECTION_ABBR.put("ВОДОСНАБ",                  "В1");
        SECTION_ABBR.put("ВОДОПРОВОД",                "В1");
        SECTION_ABBR.put("ГОРЯЧЕГО ВОДОСНАБ",         "В2");
        SECTION_ABBR.put("ГВС",                       "В2");
        // ИОС3 — Водоотведение
        SECTION_ABBR.put("ЛИВНЕВ",                    "ЛК");
        SECTION_ABBR.put("ДОЖДЕВ",                    "ЛК");
        SECTION_ABBR.put("ДРЕНАЖ",                    "ЛК");
        SECTION_ABBR.put("КАНАЛИЗ",                   "К1");
        SECTION_ABBR.put("ВОДООТВЕД",                 "К1");
        SECTION_ABBR.put("КНС",                       "КНС");
        SECTION_ABBR.put("НАСОСНАЯ СТАНЦИЯ",          "КНС");
        SECTION_ABBR.put("ОЧИСТНЫЕ",                  "ЛОС");
        // ИОС1 — Электрика
        SECTION_ABBR.put("ЗАЗЕМЛЕН",                  "ЭГ");
        SECTION_ABBR.put("МОЛНИЕЗАЩ",                 "ЭГ");
        SECTION_ABBR.put("ЭЛЕКТРООСВЕЩ",              "ЭОМ");
        SECTION_ABBR.put("ОСВЕЩЕН",                   "ЭОМ");
        SECTION_ABBR.put("ЭЛЕКТРООБОРУД",             "ЭОМ");
        SECTION_ABBR.put("СИЛОВОЕ ЭЛЕКТРО",           "ЭОМ");
        SECTION_ABBR.put("ЭЛЕКТРОСНАБ",               "ЭС");
        SECTION_ABBR.put("АИИС КУЭ",                  "АСКУЭ");
        SECTION_ABBR.put("АСКУЭ",                     "АСКУЭ");
        SECTION_ABBR.put("УЧЁТ ЭЛЕКТРО",              "АСКУЭ");
        // ПБ — Пожарная безопасность
        SECTION_ABBR.put("АВТОМАТИЧЕСКОЕ ПОЖАРОТУШ",  "АУПТ");
        SECTION_ABBR.put("ПОЖАРОТУШЕН",               "АУПТ");
        SECTION_ABBR.put("ПОЖАРНАЯ СИГНАЛИЗ",         "АПС");
        SECTION_ABBR.put("АВТОМАТИЧЕСКАЯ ПОЖАРНАЯ",   "АПС");
        SECTION_ABBR.put("АПС",                       "АПС");
        SECTION_ABBR.put("ОПОВЕЩЕН",                  "СОУЭ");
        SECTION_ABBR.put("СОУЭ",                      "СОУЭ");
        SECTION_ABBR.put("ЭВАКУАЦ",                   "СОУЭ");
        // ИОС5 — Слаботочные
        SECTION_ABBR.put("ДИСПЕТЧЕР",                 "АСУД");
        SECTION_ABBR.put("АВТОМАТИЗАЦИЯ ИНЖЕНЕРН",    "АСУД");
        SECTION_ABBR.put("БМС",                       "АСУД");
        SECTION_ABBR.put("АСУД",                      "АСУД");
        SECTION_ABBR.put("КОНТРОЛЬ ДОСТУП",           "СКУД");
        SECTION_ABBR.put("СКУД",                      "СКУД");
        SECTION_ABBR.put("ВИДЕОНАБЛЮДЕН",             "СОТ");
        SECTION_ABBR.put("ВИДЕОКОНТРОЛ",              "СОТ");
        SECTION_ABBR.put("ТЕЛЕВИЗИОН",                "СОТ");
        SECTION_ABBR.put("ОХРАННАЯ СИГНАЛИЗ",         "СОС");
        SECTION_ABBR.put("СТРУКТУРИРОВАН",            "СКС");
        SECTION_ABBR.put("КАБЕЛЬНАЯ СИСТЕМА",         "СКС");
        SECTION_ABBR.put("СКС",                       "СКС");
        SECTION_ABBR.put("ВОЛОКОННО-ОПТИЧ",           "ВОЛС");
        SECTION_ABBR.put("ВОЛС",                      "ВОЛС");
        SECTION_ABBR.put("ТЕЛЕФОН",                   "СС");
        SECTION_ABBR.put("РАДИОФИКАЦ",                "СС");
        SECTION_ABBR.put("СЕТИ СВЯЗИ",                "СС");
        SECTION_ABBR.put("СЛАБОТОЧН",                 "СС");
        SECTION_ABBR.put("ЛВС",                       "ЛВС");
        SECTION_ABBR.put("ВЫЧИСЛИТЕЛЬНАЯ СЕТЬ",       "ЛВС");
        // ИОС6 — Газ
        SECTION_ABBR.put("ГАЗОСНАБ",                  "ГС");
        SECTION_ABBR.put("ГАЗОПРОВОД",                "ГС");
        SECTION_ABBR.put("ГРП",                       "ГС");
        // КР — Конструкции
        SECTION_ABBR.put("МЕТАЛЛОКОНСТРУКЦ",          "КМ");
        SECTION_ABBR.put("КОНСТРУКЦ.*МЕТАЛЛ",         "КМ");
        SECTION_ABBR.put(" КМ ",                      "КМ");
        SECTION_ABBR.put("ЖЕЛЕЗОБЕТОН",               "КЖ");
        SECTION_ABBR.put("БЕТОННЫЕ КОНСТРУКЦ",        "КЖ");
        SECTION_ABBR.put(" КЖ ",                      "КЖ");
        SECTION_ABBR.put("ДЕРЕВЯНН",                  "КД");
        // АР / КР
        SECTION_ABBR.put("АРХИТЕКТУРН",               "АР");
        SECTION_ABBR.put("ФАСАД",                     "АР");
        SECTION_ABBR.put("ПЛАНИРОВОЧН",               "АР");
        // ПЗУ — Генплан
        SECTION_ABBR.put("ГЕНЕРАЛЬНЫЙ ПЛАН",          "ГП");
        SECTION_ABBR.put("БЛАГОУСТРОЙСТВ",            "ГП");
        SECTION_ABBR.put("ВЕРТИКАЛЬНАЯ ПЛАНИРОВК",    "ГП");
        // ПОС
        SECTION_ABBR.put("ОРГАНИЗАЦИЯ СТРОИТ",        "ПОС");
        SECTION_ABBR.put("СТРОИТЕЛЬНЫЙ ГЕНПЛАН",      "ПОС");
        // ООС
        SECTION_ABBR.put("ОХРАНА ОКРУЖАЮЩ",           "ООС");
        SECTION_ABBR.put("ОКРУЖАЮЩЕЙ СРЕДЫ",          "ООС");
        // ЭЭ
        SECTION_ABBR.put("ЭНЕРГОЭФФЕКТИВН",           "ЭЭ");
        SECTION_ABBR.put("ЭНЕРГОСБЕРЕЖЕН",            "ЭЭ");
        SECTION_ABBR.put("ПРИБОРЫ УЧЁТА",             "ЭЭ");
    }

    // ─── Keyword classifiers ──────────────────────────────────────────────────

    private static final List<String> EQUIPMENT_KW = List.of(
            "насос", "теплообменник", "котел", "котёл", "компрессор", "вентилятор",
            "кондиционер", "чиллер", "фанкойл", "калорифер", "увлажнитель",
            "регулятор", "клапан", "задвижка", "затвор", "кран", "фильтр",
            "расширительный", "гидроаккумулятор", "манометр", "термометр",
            "расходомер", "счётчик", "ультразвуковой", "преобразователь",
            "контроллер", "модуль", "панель управления", "шкаф", "щит", "пульт",
            "агрегат", "установка", "станция", "блок", "узел", "аппарат",
            "прибор", "датчик", "реле", "пускатель", "двигатель", "горелка",
            "бойлер", "бак", "резервуар", "ёмкость", "емкость",
            "вентиль", "конденсатоотводчик", "тепловычислитель"
    );

    private static final List<String> MATERIAL_KW = List.of(
            "труба", "трубопровод", "кабель", "провод", "кабель-канал",
            "лоток", "короб", "изоляция", "теплоизоляция", "утеплитель",
            "хомут", "болт", "гайка", "шайба", "шпилька", "фланец",
            "прокладка", "муфта", "тройник", "отвод", "переход", "заглушка",
            "фитинг", "арматура", "воздуховод", "виброизолятор", "анкер",
            "дюбель", "крепление", "подвеска", "опора", "стойка",
            "краска", "грунтовка", "герметик", "уплотнитель", "решётка"
    );

    // ─── Column-aware PDFTextStripper ─────────────────────────────────────────

    private static final class ColumnAwareStripper extends PDFTextStripper {

        static final float COL_GAP_PT = 10.0f;
        private float lastEndX = -1;

        ColumnAwareStripper() throws IOException {
            setSortByPosition(true);
            setLineSeparator("\n");
        }

        @Override
        protected void startPage(PDPage page) throws IOException {
            lastEndX = -1;
            super.startPage(page);
        }

        @Override
        protected void writeLineSeparator() throws IOException {
            lastEndX = -1;
            super.writeLineSeparator();
        }

        @Override
        protected void writeString(String text, List<TextPosition> textPositions) throws IOException {
            if (textPositions != null && !textPositions.isEmpty()) {
                float startX = textPositions.get(0).getX();
                if (lastEndX >= 0 && (startX - lastEndX) > COL_GAP_PT) {
                    super.writeString("\t");
                }
                TextPosition last = textPositions.get(textPositions.size() - 1);
                lastEndX = last.getX() + last.getWidth();
            }
            super.writeString(text, textPositions);
        }
    }

    // ─── Public API ───────────────────────────────────────────────────────────

    public List<ParsedSpecItemDto> parsePdf(InputStream pdfStream) {
        String fullText;
        try (PDDocument doc = Loader.loadPDF(pdfStream.readAllBytes())) {
            ColumnAwareStripper stripper = new ColumnAwareStripper();
            fullText = stripper.getText(doc);
        } catch (IOException e) {
            log.error("PDF read error: {}", e.getMessage());
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Не удалось прочитать PDF: " + e.getMessage());
        }
        log.debug("PDF extracted {} chars", fullText.length());
        return parseSpecSection(fullText);
    }

    // ─── Core parsing ─────────────────────────────────────────────────────────

    private List<ParsedSpecItemDto> parseSpecSection(String fullText) {
        String[] lines = fullText.split("\n");

        int dataStart = findDataStart(lines);
        if (dataStart < 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Секция «СПЕЦИФИКАЦИЯ ОБОРУДОВАНИЯ» не найдена. " +
                    "Убедитесь, что документ содержит таблицу спецификации по ГОСТ Р 21.1101.");
        }
        log.info("Spec data starts at line {}", dataStart);

        // Accumulate rows with section tracking
        List<Object> rowsAndSections = accumulateRowsWithSections(lines, dataStart);

        List<ParsedSpecItemDto> result = new ArrayList<>();
        int seq = 1;
        String currentSection = null;

        for (Object entry : rowsAndSections) {
            if (entry instanceof SectionHeader sh) {
                currentSection = sh.label();
            } else if (entry instanceof String rowText) {
                ParsedSpecItemDto dto = parseRow(rowText, seq, currentSection);
                if (dto != null) {
                    result.add(dto);
                    seq++;
                }
            }
        }

        log.info("Parsed {} spec items across {} section(s)",
                result.size(),
                result.stream().map(ParsedSpecItemDto::sectionName).distinct().count());

        if (result.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Строки спецификации не обнаружены. Возможно, документ использует нестандартный формат.");
        }
        return result;
    }

    /** Marker record for a section header found in the spec body. */
    private record SectionHeader(String label) {}

    // ─── Section detection ────────────────────────────────────────────────────

    private int findDataStart(String[] lines) {
        int specMarkerLine = -1;
        int colHeaderLine  = -1;

        for (int i = 0; i < lines.length; i++) {
            String trimmed = lines[i].replaceAll("\t", " ").trim();
            String upper   = trimmed.toUpperCase();

            if (specMarkerLine < 0
                    && upper.contains("СПЕЦИФИКАЦИЯ")
                    && trimmed.equals(upper)
                    && !upper.contains("СТР.")
                    && !upper.contains("СТАДИЯ")
                    && trimmed.length() > 5) {
                specMarkerLine = i;
            }

            if (colHeaderLine < 0 && isColumnHeader(trimmed)) {
                colHeaderLine = i;
            }
        }

        int anchor = specMarkerLine >= 0 ? specMarkerLine : colHeaderLine;
        if (anchor < 0) return -1;

        int dataStart = anchor + 1;
        int scanTo    = Math.min(anchor + 12, lines.length);
        for (int i = anchor; i < scanTo; i++) {
            if (isColumnHeader(lines[i].replaceAll("\t", " ").trim())) {
                dataStart = i + 1;
            }
        }
        return dataStart;
    }

    // ─── Row accumulation with section tracking ───────────────────────────────

    /**
     * Returns a mixed list of {@link SectionHeader} and {@link String} (row text) entries.
     * Section headers are detected as ALL-CAPS lines that don't start with a position number.
     */
    private List<Object> accumulateRowsWithSections(String[] lines, int from) {
        List<Object> entries  = new ArrayList<>();
        StringBuilder cur     = new StringBuilder();
        boolean seenItem      = false;
        int     emptyStreak   = 0;

        for (int i = from; i < lines.length; i++) {
            String rawLine = lines[i];
            String trimmed = rawLine.replaceAll("\t", " ").trim();

            if (trimmed.isEmpty()) continue;
            if (isStampLine(trimmed)) continue;
            if (isColumnHeader(trimmed)) continue;

            String lineForMatch = rawLine.trim();
            String noTabStart   = lineForMatch.replaceFirst("^\t+", "");

            Matcher m = POSITION_PATTERN.matcher(noTabStart);
            boolean isNewItem = m.matches() && m.group(1).length() <= 6;

            if (isNewItem) {
                if (cur.length() > 0) entries.add(cur.toString().trim());
                cur = new StringBuilder(lineForMatch);
                seenItem    = true;
                emptyStreak = 0;
            } else if (isSectionHeader(trimmed)) {
                // Flush any pending item buffer
                if (cur.length() > 0) {
                    entries.add(cur.toString().trim());
                    cur = new StringBuilder();
                }
                String abbr  = lookupAbbreviation(trimmed);
                String label = abbr != null
                        ? trimmed + " (" + abbr + ")"
                        : trimmed;
                entries.add(new SectionHeader(label));
                seenItem    = true;
                emptyStreak = 0;
            } else if (cur.length() > 0) {
                // Continuation line
                cur.append(' ').append(lineForMatch);
                emptyStreak = 0;
            } else {
                if (seenItem) {
                    emptyStreak++;
                    if (emptyStreak > 25) break;
                }
            }
        }
        if (cur.length() > 0) entries.add(cur.toString().trim());
        return entries;
    }

    /**
     * Returns true if a line looks like a section header inside the spec body:
     * - At least 8 and at most 150 chars
     * - Doesn't start with a position number
     * - Mostly uppercase (≥ 60% of alpha chars are uppercase)
     * - Contains at least one Cyrillic word ≥ 4 chars
     */
    private boolean isSectionHeader(String line) {
        int len = line.length();
        if (len < 8 || len > 150) return false;

        // Must not be a stamp or column header line
        if (isStampLine(line) || isColumnHeader(line)) return false;

        // Must not start with a position number
        if (POSITION_PATTERN.matcher(line).matches()) return false;

        // Check uppercase ratio
        long alphaCount = line.chars().filter(Character::isLetter).count();
        if (alphaCount < 4) return false;
        long upperCount = line.chars().filter(c -> Character.isLetter(c) && Character.isUpperCase(c)).count();
        double upperRatio = (double) upperCount / alphaCount;
        if (upperRatio < 0.60) return false;

        // Must contain at least one Cyrillic word ≥ 4 chars
        boolean hasCyrillicWord = line.matches(".*[А-ЯЁа-яё]{4,}.*");
        return hasCyrillicWord;
    }

    /**
     * Looks up a known engineering discipline abbreviation for a section header.
     * Uses keyword-based matching (case-insensitive, on the uppercase line).
     */
    private String lookupAbbreviation(String sectionLine) {
        String upper = sectionLine.toUpperCase();
        for (Map.Entry<String, String> entry : SECTION_ABBR.entrySet()) {
            String keyword = entry.getKey().toUpperCase();
            if (upper.contains(keyword)) {
                String abbr = entry.getValue();
                // Don't add if abbreviation already present in the name (e.g. "... (ИТП)")
                if (upper.contains("(" + abbr + ")") || upper.contains("(" + abbr.toUpperCase() + ")")) {
                    return null;
                }
                return abbr;
            }
        }
        return null;
    }

    // ─── Row → DTO ────────────────────────────────────────────────────────────

    private ParsedSpecItemDto parseRow(String rowText, int seq, String sectionName) {
        String stripped = rowText.replaceFirst("^\t+", "").trim();

        Matcher m = POSITION_PATTERN.matcher(stripped);
        if (!m.matches() || m.group(1).length() > 6) return null;

        String position = m.group(1);
        String rest     = m.group(3).trim();
        if (rest.isBlank()) return null;

        if (rest.contains("\t")) {
            return parseRowTabbed(position, rest, sectionName);
        } else {
            return parseRowSpaced(position, rest, sectionName);
        }
    }

    private ParsedSpecItemDto parseRowTabbed(String position, String rest, String sectionName) {
        String[] cols = rest.split("\t");

        int unitColIdx = -1;
        for (int i = cols.length - 1; i >= 0; i--) {
            if (UNITS.contains(cols[i].trim().toLowerCase())) {
                unitColIdx = i;
                break;
            }
        }

        String     parsedName, brand, productCode, manufacturer, unitOfMeasure;
        BigDecimal quantity, mass;
        String     notes;

        if (unitColIdx >= 0) {
            parsedName   = unitColIdx > 0 ? cols[0].trim() : "";
            brand        = unitColIdx > 1 ? cols[1].trim() : null;
            productCode  = unitColIdx > 2 ? cols[2].trim() : null;

            if (unitColIdx > 3) {
                manufacturer = IntStream.range(3, unitColIdx)
                        .mapToObj(i -> cols[i].trim())
                        .filter(s -> !s.isEmpty())
                        .collect(Collectors.joining(" "));
            } else {
                manufacturer = null;
            }

            unitOfMeasure = cols[unitColIdx].trim();
            String qtyStr  = get(cols, unitColIdx + 1);
            String mass1Str = get(cols, unitColIdx + 2);
            String mass2Str = get(cols, unitColIdx + 3);

            quantity = tryParseBigDecimal(qtyStr, BigDecimal.ONE);
            boolean hasMass1 = isNumeric(mass1Str);
            boolean hasMass2 = isNumeric(mass2Str);
            mass = hasMass1 ? tryParseBigDecimal(mass1Str, null) : null;

            int notesStart = unitColIdx + (hasMass2 ? 4 : (hasMass1 ? 3 : 2));
            if (notesStart < cols.length) {
                String raw = IntStream.range(notesStart, cols.length)
                        .mapToObj(i -> cols[i].trim())
                        .filter(s -> !s.isEmpty())
                        .collect(Collectors.joining(" "));
                notes = raw.isEmpty() ? null : raw;
            } else {
                notes = null;
            }
        } else {
            parsedName   = cols[0].trim();
            brand        = cols.length > 1 ? cols[1].trim() : null;
            productCode  = cols.length > 2 ? cols[2].trim() : null;
            manufacturer = cols.length > 3
                    ? IntStream.range(3, cols.length).mapToObj(i -> cols[i].trim())
                               .filter(s -> !s.isEmpty()).collect(Collectors.joining(" "))
                    : null;
            unitOfMeasure = "шт.";
            quantity      = BigDecimal.ONE;
            mass          = null;
            notes         = null;
        }

        return buildDto(position, parsedName, brand, productCode, manufacturer,
                        unitOfMeasure, quantity, mass, notes, sectionName);
    }

    private ParsedSpecItemDto parseRowSpaced(String position, String rest, String sectionName) {
        String[] tokens = rest.split("\\s+");

        int unitIdx = -1;
        for (int i = tokens.length - 1; i >= 0; i--) {
            if (UNITS.contains(tokens[i].toLowerCase())) {
                unitIdx = i;
                break;
            }
        }

        String     parsedName, brand = null, productCode = null, manufacturer = null;
        String     unitOfMeasure;
        BigDecimal quantity, mass = null;
        String     notes = null;

        if (unitIdx >= 0) {
            String nameText   = String.join(" ", Arrays.copyOfRange(tokens, 0, unitIdx)).trim();
            unitOfMeasure     = tokens[unitIdx];
            quantity          = tryParseBigDecimal(get(tokens, unitIdx + 1), BigDecimal.ONE);
            if (unitIdx + 2 < tokens.length && isNumeric(tokens[unitIdx + 2])) {
                mass = tryParseBigDecimal(tokens[unitIdx + 2], null);
            }
            if (unitIdx + 3 < tokens.length) {
                notes = String.join(" ", Arrays.copyOfRange(tokens, unitIdx + 3, tokens.length));
            }

            String[] colParts = nameText.split("\\s{2,}");
            parsedName   = colParts[0].trim();
            brand        = colParts.length >= 2 ? colParts[1].trim() : null;
            productCode  = colParts.length >= 3 ? colParts[2].trim() : null;
            manufacturer = colParts.length >= 4
                    ? String.join(" ", Arrays.copyOfRange(colParts, 3, colParts.length)).trim() : null;
        } else {
            parsedName    = rest;
            unitOfMeasure = "шт.";
            quantity      = BigDecimal.ONE;
        }

        return buildDto(position, parsedName, brand, productCode, manufacturer,
                        unitOfMeasure, quantity, mass, notes, sectionName);
    }

    /**
     * Strips drawing-stamp boilerplate that leaks into notes / field values.
     * Stamp lines contain approval-block terms common to ГОСТ Р 21.1101 title blocks.
     */
    private static final List<String> STAMP_TERMS = List.of(
            "подп. и дата", "подп.и дата", "взаим. инв.", "инв. № подл.", "инв. №подл.",
            "инв. № дубл.", "инв. №дубл.", "спецификация оборудования,",
            "подразд.", "подраздел"
    );

    private String cleanStampText(String raw) {
        if (raw == null || raw.isBlank()) return null;
        String lower = raw.toLowerCase();
        for (String term : STAMP_TERMS) {
            int idx = lower.indexOf(term);
            if (idx >= 0) {
                // Keep text before the stamp keyword (may be a valid note prefix like "Или аналог")
                String before = raw.substring(0, idx).trim();
                return before.isEmpty() ? null : before;
            }
        }
        // If it looks like a page-number + project-header line (starts with digits like "0.19 ...")
        // and is very long, it's likely stamp text
        if (raw.matches("^\\d+\\.\\d+\\s+.*") && raw.length() > 40) return null;
        // Truncate extremely long notes (> 300 chars) — almost certainly corrupt
        if (raw.length() > 300) return raw.substring(0, 300).trim();
        return raw;
    }

    private ParsedSpecItemDto buildDto(
            String position, String parsedName,
            String brand, String productCode, String manufacturer,
            String unitOfMeasure, BigDecimal quantity, BigDecimal mass,
            String notes, String sectionName) {

        if (parsedName == null || parsedName.isBlank()) return null;

        brand        = blankToNull(cleanStampText(brand));
        productCode  = blankToNull(productCode);
        manufacturer = blankToNull(cleanStampText(manufacturer));
        notes        = blankToNull(cleanStampText(notes));
        sectionName  = blankToNull(sectionName);

        String itemType = detectItemType(parsedName, brand);

        return new ParsedSpecItemDto(
                position, itemType, parsedName,
                brand, productCode, manufacturer,
                unitOfMeasure, quantity, mass, notes,
                sectionName
        );
    }

    // ─── Item type detection ──────────────────────────────────────────────────

    private String detectItemType(String name, String brand) {
        String text = ((name  == null ? "" : name)  + " " +
                       (brand == null ? "" : brand)).toLowerCase();
        for (String kw : MATERIAL_KW)  { if (text.contains(kw)) return "MATERIAL"; }
        for (String kw : EQUIPMENT_KW) { if (text.contains(kw)) return "EQUIPMENT"; }
        return "EQUIPMENT";
    }

    // ─── Stamp / footer detection ─────────────────────────────────────────────

    private boolean isStampLine(String line) {
        String lower = line.toLowerCase().trim();
        if (lower.length() <= 4 && !UNITS.contains(lower)) return true;
        if (lower.startsWith("разраб.") || lower.startsWith("пров.")
                || lower.startsWith("н.контр") || lower.startsWith("н. контр")
                || lower.startsWith("утв.") || lower.startsWith("гип ")) return true;
        if (lower.startsWith("изм.") && lower.length() < 60) return true;
        if (lower.contains("кол.уч") || lower.contains("ьсипдоп") || lower.contains("ьсипдП")) return true;
        if (lower.contains("стадия") && (lower.contains("лист") || lower.contains("листов"))) return true;
        if (line.matches("^[РрRr]\\s+\\d+.*")) return true;
        if (line.matches(".*[а-яёА-ЯЁ]\\.[а-яёА-ЯЁ].*") && line.trim().length() < 20) return true;
        if (line.trim().matches("\\d{2}\\.\\d{2}") || line.trim().matches("\\d{2}\\.\\d{2}\\s.*")) return true;
        return false;
    }

    private boolean isColumnHeader(String line) {
        String lower = line.toLowerCase();
        boolean hasPos  = lower.contains("позиция") || lower.contains("поз.");
        boolean hasName = lower.contains("наименование") || lower.contains("наимено");
        boolean hasZav  = lower.contains("завод") || lower.contains("изготовитель") || lower.contains("ед. изм");
        return (hasPos && hasName) || (hasPos && hasZav) || (hasName && hasZav && lower.contains("код"));
    }

    // ─── Helpers ──────────────────────────────────────────────────────────────

    private static String get(String[] arr, int idx) {
        return (arr != null && idx >= 0 && idx < arr.length) ? arr[idx].trim() : null;
    }

    private static String blankToNull(String s) {
        return (s == null || s.isBlank()) ? null : s.trim();
    }

    private boolean isNumeric(String s) {
        return s != null && s.matches("\\d+([.,]\\d+)?");
    }

    private BigDecimal tryParseBigDecimal(String s, BigDecimal fallback) {
        if (!isNumeric(s)) return fallback;
        try { return new BigDecimal(s.replace(',', '.')); }
        catch (NumberFormatException e) { return fallback; }
    }
}
