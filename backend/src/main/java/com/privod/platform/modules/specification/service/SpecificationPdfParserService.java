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

    /** Mass units that appear in column 7 «Масса единицы, кг» — NOT the item unit. */
    private static final Set<String> MASS_UNITS = Set.of("кг", "кг.", "т.", "т");

    private static boolean isMassUnit(String unit) {
        return unit != null && MASS_UNITS.contains(unit.trim().toLowerCase());
    }

    // ─── Position pattern ─────────────────────────────────────────────────────

    private static final Pattern POSITION_PATTERN = Pattern.compile(
            "^([А-ЯЁа-яёA-Za-z]?\\d{1,3}([.\\-][А-ЯЁа-яёa-zA-Z\\d]{1,3}){0,3})\\s+(.*)",
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
        // АОВ — Автоматизация вентиляции
        SECTION_ABBR.put("ПРИБОРЫ И СРЕДСТВА АВТОМАТИЗАЦИИ", "КИПиА");
        SECTION_ABBR.put("АППАРАТУРА ПО МЕСТУ",        "АПМ");
        SECTION_ABBR.put("ЩИТЫ И ПУЛЬТЫ",              "ЩА");
        SECTION_ABBR.put("ЩИТЫ АВТОМАТИКИ",            "ЩА");
        SECTION_ABBR.put("СЕРИЙНЫЕ ИЗДЕЛИЯ",            "СИ");
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
        // ОВ-specific system sections (mixed-case headers in ОВ specs)
        SECTION_ABBR.put("СИСТЕМА ОТОПЛ",             "ОВ");
        SECTION_ABBR.put("СИСТЕМА ВЕНТИЛ",            "ОВ");
        SECTION_ABBR.put("СИСТЕМА КОНДИЦ",            "ОВиК");
        SECTION_ABBR.put("СИСТЕМА ДЫМОУДАЛ",          "ДП");
        SECTION_ABBR.put("СИСТЕМА ХОЛОДОСН",          "ХС");
        SECTION_ABBR.put("СИСТЕМА ТЕПЛОСН",           "ТС");
        SECTION_ABBR.put("СИСТЕМА ВОДОСН",            "В1");
        SECTION_ABBR.put("СИСТЕМА КАНАЛИЗ",           "К1");
        SECTION_ABBR.put("СИСТЕМА ГАЗОСН",            "ГС");
        SECTION_ABBR.put("СИСТЕМА ЭЛЕКТРОСН",         "ЭС");
        SECTION_ABBR.put("ОБЩЕОБМЕНН",                "ОВ");
        SECTION_ABBR.put("РАДИАТОРН",                 "ОВ");
        SECTION_ABBR.put("ТЁПЛЫЙ ПОЛ",                "ОВ");
        SECTION_ABBR.put("ТЕПЛЫЙ ПОЛ",                "ОВ");
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
                    "Таблица спецификации не найдена. " +
                    "Убедитесь, что документ содержит таблицу спецификации по ГОСТ Р 21.1101 " +
                    "с колонками «Позиция», «Наименование», «Завод-изготовитель» и т.д.");
        }
        log.info("Spec data starts at line {}", dataStart);

        // Accumulate rows with section tracking (position-based)
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

        // Fallback: if position-based parsing yielded too few items (< 5),
        // try position-less parsing. This handles ИТП-style spec tables where
        // items have no explicit position numbers (just name [TAB] brand [TAB] unit).
        if (result.size() < 5) {
            log.info("Position-based parsing found only {} items — trying position-less mode", result.size());
            List<ParsedSpecItemDto> positionLessResult = parsePositionLessRows(lines, dataStart);
            if (positionLessResult.size() > result.size()) {
                log.info("Position-less mode found {} items (better than {})", positionLessResult.size(), result.size());
                result = positionLessResult;
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
        // 1. Find "Спецификация" markers — collect ALL valid ones (first is usually best).
        //    The FIRST marker is preferred because later ones may be in stamp text or
        //    vendor attachment pages (ТКП) appended after the main spec.
        int firstSpecMarker = -1;
        int lastSpecMarker = -1;
        for (int i = 0; i < lines.length; i++) {
            String trimmed = lines[i].replaceAll("\t", " ").trim();
            String lower = trimmed.toLowerCase();

            if (lower.contains("спецификация")
                    && !lower.contains("стр.")
                    && !lower.contains("стадия")
                    && !lower.contains("подп.")
                    && !lower.contains("инв. №")
                    && !lower.contains("инв.№")
                    && !lower.contains("подразд")
                    && !lower.contains(", изделий")
                    && !lower.contains("материалов")
                    // Filter stamp lines: "Н контр" / "Н.контр" / "Нормоконтроль" prefix
                    && !lower.startsWith("н контр")
                    && !lower.startsWith("н.контр")
                    && !lower.startsWith("норм")
                    && trimmed.length() > 5
                    && trimmed.length() < 100) {
                if (firstSpecMarker < 0) {
                    firstSpecMarker = i;
                }
                lastSpecMarker = i;
            }
        }

        // Use the first marker as primary reference, but keep last for fallback
        int specMarkerLine = firstSpecMarker;

        // 2. Two-phase column header search:
        //    Phase A: Full scan from beginning — find the FIRST line with score >= 4.
        //             This catches ИТП-style PDFs where the spec table header (page 15)
        //             appears BEFORE the "Спецификация" stamp text (bottom of page 15).
        //    Phase B: If Phase A found nothing, search near specMarkerLine.
        int bestHeaderLine = -1;
        int bestScore = 0;

        // Phase A: scan from beginning, stop at first good header
        for (int i = 0; i < lines.length; i++) {
            int score = columnHeaderWindowScore(lines, i);
            if (score > bestScore) {
                bestScore = score;
                bestHeaderLine = i;
            }
            if (bestScore >= 4) break;
        }

        // Phase B: if specMarkerLine exists and is reasonably close to Phase A result,
        // check if there's a CLOSER header near the marker (within ±20 lines).
        // This helps when early pages have noise that scores 4+ but isn't the real table.
        if (specMarkerLine >= 0 && bestHeaderLine >= 0 && bestScore >= 4) {
            // If the best header is near the specMarker (within 50 lines before it),
            // it's likely the real table header — keep it.
            // If it's far away, check if there's also a good header near specMarker.
            int distToMarker = specMarkerLine - bestHeaderLine;
            if (distToMarker > 50) {
                // The header is far before the spec marker — could be noise.
                // Look for a header near the specMarker that's also good.
                int nearSearchFrom = Math.max(specMarkerLine - 20, 0);
                int nearSearchTo = Math.min(specMarkerLine + 20, lines.length);
                int nearBestLine = -1;
                int nearBestScore = 0;
                for (int i = nearSearchFrom; i < nearSearchTo; i++) {
                    int score = columnHeaderWindowScore(lines, i);
                    if (score > nearBestScore) {
                        nearBestScore = score;
                        nearBestLine = i;
                    }
                }
                // Only override if the near-marker header is at least as good
                if (nearBestScore >= bestScore) {
                    bestScore = nearBestScore;
                    bestHeaderLine = nearBestLine;
                }
                // Otherwise keep the earlier header — it's likely the real first table page
            }
        }

        // Phase C: if still no header, try searching from specMarkerLine backwards
        if (bestScore < 4 && specMarkerLine >= 0) {
            for (int i = Math.max(specMarkerLine - 50, 0); i < Math.min(specMarkerLine + 20, lines.length); i++) {
                int score = columnHeaderWindowScore(lines, i);
                if (score > bestScore) {
                    bestScore = score;
                    bestHeaderLine = i;
                }
                if (bestScore >= 4) break;
            }
        }

        // 3. Determine anchor
        int anchor;
        if (bestHeaderLine >= 0 && bestScore >= 4) {
            anchor = bestHeaderLine;
        } else if (specMarkerLine >= 0) {
            anchor = specMarkerLine;
        } else if (bestHeaderLine >= 0) {
            anchor = bestHeaderLine;
        } else {
            return -1;
        }

        log.info("findDataStart: firstSpecMarker={}, lastSpecMarker={}, bestHeader={} (score={}), anchor={}",
                firstSpecMarker, lastSpecMarker, bestHeaderLine, bestScore, anchor);

        // 4. Scan forward from anchor to find last header line (headers may span 2-3 lines)
        int dataStart = anchor + 1;
        int scanTo = Math.min(anchor + 12, lines.length);
        for (int i = anchor; i < scanTo; i++) {
            if (isColumnHeader(lines[i].replaceAll("\t", " ").trim())) {
                dataStart = i + 1;
            }
        }
        return dataStart;
    }

    /**
     * Scores a window of up to 3 lines starting at {@code from} for column-header quality.
     * Higher score = more column keywords found = more likely the main СО table header.
     * Mini-tables (Поз/Наименование/Кол/Примечание) score ~3-4.
     * Main spec tables (Позиция/Наименование/Тип,марка/Код/Завод/Ед.изм/Масса/...) score 7+.
     */
    private int columnHeaderWindowScore(String[] lines, int from) {
        // First line must contain at least one column keyword to anchor the window
        String firstLower = lines[from].replaceAll("\t", " ").trim().toLowerCase();
        boolean anchorOk = firstLower.contains("позиция") || firstLower.contains("поз.")
                || firstLower.contains("наименование") || firstLower.contains("наимено")
                || firstLower.contains("тип") || firstLower.contains("марка")
                || firstLower.contains("завод") || firstLower.contains("изготовитель")
                || firstLower.contains("техническая характеристика")
                || firstLower.contains("обозначение")
                || firstLower.contains("поставщик");
        if (!anchorOk) return 0;

        // Build combined text from up to 4 consecutive lines (ИТП headers span 4-5 lines)
        StringBuilder sb = new StringBuilder();
        int end = Math.min(from + 4, lines.length);
        for (int i = from; i < end; i++) {
            sb.append(' ').append(lines[i].replaceAll("\t", " ").trim().toLowerCase());
        }
        String window = sb.toString();

        boolean hasPos  = window.contains("позиция") || window.contains("поз.");
        boolean hasName = window.contains("наименование") || window.contains("техническая характеристика");
        if (!hasPos && !hasName) return 0;

        // Basic qualification check — also accept "поставщик" as a supplier column indicator
        boolean hasZav  = window.contains("завод") || window.contains("изготовитель")
                || window.contains("поставщик");
        boolean hasCode = window.contains("код") || window.contains("обозначение");
        if (!(hasPos && hasName) && !(hasPos && hasZav) && !(hasName && hasZav && hasCode)) return 0;

        // Score — each recognized column keyword adds a point
        int score = 0;
        if (hasPos)  score++;
        if (hasName) score++;
        if (hasZav)  score++;
        if (window.contains("ед. изм") || window.contains("единица измерения")
                || window.contains("единица") || window.contains("ед.")) score++;
        if (window.contains("тип") || window.contains("марка")) score++;
        if (hasCode) score++;
        if (window.contains("масса") || window.contains("вес")) score++;
        if (window.contains("кол-во") || window.contains("количество") || window.contains("кол.")) score++;
        if (window.contains("примечание")) score++;
        // ИТП-style: "техническая характеристика" is a strong signal
        if (window.contains("техническая характеристика")) score++;

        return score;
    }

    // ─── Row accumulation with section tracking ───────────────────────────────

    /**
     * Returns a mixed list of {@link SectionHeader} and {@link String} (row text) entries.
     * Section headers are detected either as:
     * <ul>
     *   <li>Numbered section headers (e.g., "1  Приборы и средства автоматизации") —
     *       single-digit position with no column data after the title</li>
     *   <li>ALL-CAPS lines that don't start with a position number</li>
     * </ul>
     */
    private List<Object> accumulateRowsWithSections(String[] lines, int from) {
        List<Object> entries  = new ArrayList<>();
        // firstLine: original first line of the item (with tabs, preserves column positions)
        // contText:  continuation text (tabs replaced with spaces) for name extension
        String firstLine       = null;
        StringBuilder contText = new StringBuilder();
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
                String posStr       = m.group(1);
                String restAfterPos = m.group(3);

                if (isNumberedSectionHeader(posStr, restAfterPos, rawLine)) {
                    if (firstLine != null) {
                        flushRow(entries, firstLine, contText);
                        firstLine = null;
                    }
                    log.debug("Numbered section: pos={}, title={}", posStr, restAfterPos.trim());
                    String sectionTitle = restAfterPos.trim();
                    String abbr  = lookupAbbreviation(sectionTitle);
                    String label = abbr != null
                            ? sectionTitle + " (" + abbr + ")"
                            : sectionTitle;
                    entries.add(new SectionHeader(label));
                    seenItem    = true;
                    emptyStreak = 0;
                } else {
                    if (firstLine != null) flushRow(entries, firstLine, contText);
                    firstLine = lineForMatch;
                    contText = new StringBuilder();
                    seenItem    = true;
                    emptyStreak = 0;
                }
            } else if (isSectionHeader(trimmed)) {
                if (firstLine != null) {
                    flushRow(entries, firstLine, contText);
                    firstLine = null;
                }
                log.debug("Section header: {}", trimmed);
                String abbr  = lookupAbbreviation(trimmed);
                String label = abbr != null
                        ? trimmed + " (" + abbr + ")"
                        : trimmed;
                entries.add(new SectionHeader(label));
                seenItem    = true;
                emptyStreak = 0;
            } else if (firstLine != null) {
                // Continuation line: replace tabs with spaces and accumulate.
                // This preserves the first line's tab structure (unit/qty columns)
                // while collecting continuation text for the name field.
                // Skip ГОСТ footnote/note fragments that are not part of the item name.
                if (!trimmed.isBlank() && !isFootnoteLine(trimmed)) {
                    contText.append(' ').append(trimmed);
                }
                emptyStreak = 0;
            } else {
                if (seenItem) {
                    emptyStreak++;
                    if (emptyStreak > 25) break;
                }
            }
        }
        if (firstLine != null) flushRow(entries, firstLine, contText);
        return entries;
    }

    // ─── Position-less row parsing (ИТП style) ──────────────────────────────

    /**
     * Parses spec table rows that have NO explicit position numbers.
     * <p>
     * ИТП-style spec tables have items like:
     * <pre>
     * Тепловой пункт блочного исполнения – Узел нагрева ...  [TAB]  Компл.
     * Труба стальная горячедеформированная ... Труба 3 х4,0 ГОСТ 8732
     * 4,0мм ...  [TAB]  м
     * </pre>
     * Items are identified by:
     * - Starting with an uppercase Cyrillic letter (not a stamp/footer)
     * - Having recognizable unit of measure (шт, м, компл, etc.) somewhere
     * - NOT being a section header or stamp line
     */
    private List<ParsedSpecItemDto> parsePositionLessRows(String[] lines, int from) {
        List<ParsedSpecItemDto> result = new ArrayList<>();
        String currentSection = null;
        int seq = 1;
        int noItemStreak = 0; // count lines without items to detect spec table end

        // Accumulate multi-line items: an item starts with an uppercase Cyrillic letter
        // and may span multiple lines. The item ends when the next uppercase line starts a new item.
        StringBuilder currentItem = new StringBuilder();
        boolean inItem = false;

        for (int i = from; i < lines.length; i++) {
            String rawLine = lines[i];
            String trimmed = rawLine.replaceAll("\t", " ").trim();

            if (trimmed.isEmpty()) { noItemStreak++; continue; }
            if (isStampLine(trimmed)) continue;
            if (isColumnHeader(trimmed)) continue;
            if (isPositionLessNoiseLine(trimmed)) continue;

            // Detect end of spec table: long stretches of non-item text
            // (appendices, algorithms, etc. that follow the spec table)
            if (noItemStreak > 30 && result.size() > 10) break;

            // Section header detection
            if (isSectionHeader(trimmed)) {
                if (inItem && currentItem.length() > 0) {
                    ParsedSpecItemDto dto = parsePositionLessItem(currentItem.toString().trim(), seq, currentSection);
                    if (dto != null) { result.add(dto); seq++; }
                    currentItem.setLength(0);
                    inItem = false;
                }
                String abbr = lookupAbbreviation(trimmed);
                currentSection = abbr != null ? trimmed + " (" + abbr + ")" : trimmed;
                noItemStreak = 0;
                continue;
            }

            // Detect numbered section header (e.g., position "1" with section title)
            String noTabStart = rawLine.trim().replaceFirst("^\t+", "");
            Matcher posM = POSITION_PATTERN.matcher(noTabStart);
            if (posM.matches() && posM.group(1).length() <= 6) {
                String posStr = posM.group(1);
                String restAfterPos = posM.group(3);
                if (isNumberedSectionHeader(posStr, restAfterPos, rawLine)) {
                    if (inItem && currentItem.length() > 0) {
                        ParsedSpecItemDto dto = parsePositionLessItem(currentItem.toString().trim(), seq, currentSection);
                        if (dto != null) { result.add(dto); seq++; }
                        currentItem.setLength(0);
                        inItem = false;
                    }
                    String sectionTitle = restAfterPos.trim();
                    String abbr = lookupAbbreviation(sectionTitle);
                    currentSection = abbr != null ? sectionTitle + " (" + abbr + ")" : sectionTitle;
                    noItemStreak = 0;
                    continue;
                }
            }

            // Lines starting with "ГОСТ" or "ТУ" are continuations of the previous item
            // (GOST/TU code that wrapped to the next line), not new items.
            String upper = trimmed.toUpperCase();
            boolean isGostContinuation = upper.startsWith("ГОСТ ") || upper.startsWith("ТУ ")
                    || upper.matches("^ГОСТ\\d+.*");
            if (isGostContinuation && inItem) {
                currentItem.append(' ').append(trimmed);
                noItemStreak = 0;
                continue;
            }

            // Detect if this line starts a new item:
            // - Starts with uppercase Cyrillic letter
            // - Is not a footnote line
            // - Is not a stamp/administrative line
            char firstChar = trimmed.charAt(0);
            boolean startsNewItem = Character.isUpperCase(firstChar)
                    && isCyrillic(firstChar)
                    && trimmed.length() >= 10
                    && !isFootnoteLine(trimmed)
                    && !isPositionLessNoiseLine(trimmed);

            if (startsNewItem) {
                // Flush previous item
                if (inItem && currentItem.length() > 0) {
                    ParsedSpecItemDto dto = parsePositionLessItem(currentItem.toString().trim(), seq, currentSection);
                    if (dto != null) { result.add(dto); seq++; }
                    currentItem.setLength(0);
                }
                // Start new item, preserving tab structure of the first line
                currentItem.append(rawLine.trim());
                inItem = true;
                noItemStreak = 0;
            } else if (inItem) {
                // Continuation line
                if (!isFootnoteLine(trimmed)) {
                    currentItem.append(' ').append(trimmed);
                }
                noItemStreak = 0;
            } else {
                noItemStreak++;
            }
        }

        // Flush last item
        if (inItem && currentItem.length() > 0) {
            ParsedSpecItemDto dto = parsePositionLessItem(currentItem.toString().trim(), seq, currentSection);
            if (dto != null) { result.add(dto); seq++; }
        }

        return result;
    }

    /**
     * Returns true for noise lines that should be skipped in position-less parsing.
     * These are administrative/stamp text lines that look like items (start with
     * uppercase Cyrillic) but are not equipment or material entries.
     */
    private boolean isPositionLessNoiseLine(String line) {
        String lower = line.trim().toLowerCase();

        // Drawing stamp approval lines
        if (lower.startsWith("нач.группы") || lower.startsWith("нач. группы")
                || lower.startsWith("нач.отд") || lower.startsWith("нач. отд")
                || lower.startsWith("норм.контр") || lower.startsWith("норм. контр")
                || lower.startsWith("гл.спец") || lower.startsWith("гл. спец")
                || lower.startsWith("н контр") || lower.startsWith("н.контр")) return true;

        // Company name lines from stamp: "АО «Казанский", "Гипронииавиапром»"
        if (lower.startsWith("ао «") || lower.startsWith("ао \"")
                || lower.endsWith("»") && lower.length() < 30) return true;

        // "Спецификация оборудования," title line
        if (lower.startsWith("спецификация оборуд")) return true;

        // "изделий и материалов" continuation of title
        if (lower.startsWith("изделий и материал")) return true;

        // Drawing stamp metadata: "Инв. подл.", "Подпись и дата", etc.
        if (lower.startsWith("инв.") || lower.startsWith("подп")
                || lower.startsWith("взам.") || lower.startsWith("взаим.")) return true;

        // Appendix markers — signal end of spec table
        if (lower.startsWith("приложение ") && lower.length() < 30) return true;

        // Algorithm/description text (appears in ИТП after the spec table)
        if (lower.startsWith("рабочий режим") || lower.startsWith("алгоритм управлен")
                || lower.startsWith("запуск и порядок") || lower.startsWith("далее дается")
                || lower.startsWith("последовательное включ") || lower.startsWith("время на")
                || lower.startsWith("управление работой") || lower.startsWith("предусматривается возможность")
                || lower.startsWith("при достижении") || lower.startsWith("при отсутствии")
                || lower.startsWith("запуск в работу")) return true;

        // Vendor proposal text
        if (lower.startsWith("от:") || lower.startsWith("для ") && lower.contains("казань")
                || lower.startsWith("компания ") || lower.startsWith("тел.")) return true;

        return false;
    }

    private boolean isCyrillic(char c) {
        return (c >= '\u0400' && c <= '\u04FF');
    }

    /**
     * Parses a single position-less item row.
     * <p>
     * The row has no leading position number. Structure is typically:
     * {@code Name description [TAB] Brand/Type [TAB] unit}
     * or {@code Name description Brand/Type [TAB] unit [TAB] qty}
     */
    private ParsedSpecItemDto parsePositionLessItem(String rowText, int seq, String sectionName) {
        if (rowText == null || rowText.isBlank()) return null;

        String stripped = rowText.trim();
        // Reject very short lines
        if (stripped.length() < 10) return null;

        // Try to parse as a tabbed row (reuse existing logic with a synthetic position)
        String syntheticPosition = String.valueOf(seq);

        ParsedSpecItemDto dto;
        if (stripped.contains("\t")) {
            dto = parseRowTabbed(syntheticPosition, stripped, sectionName);
        } else {
            dto = parseRowSpaced(syntheticPosition, stripped, sectionName);
        }
        return dto;
    }

    /**
     * Returns true if a line looks like a ГОСТ table footnote/note rather than
     * a continuation of the item name. These are common phrases from spec table
     * annotation blocks that span across columns and get picked up by
     * ColumnAwareStripper as regular text lines.
     */
    private boolean isFootnoteLine(String line) {
        String trimmed = line.trim();
        if (trimmed.isEmpty()) return true;
        String lower = trimmed.toLowerCase();

        // ── Stamp/drawing frame text ──
        // Lines containing ГОСТ drawing stamp text like "Инв. № подп."
        if (lower.contains("инв.") || lower.contains("подп.") || lower.contains("взам.")) return true;

        // ── Bullet-point specification lines ──
        // ГОСТ spec tables often have specification details as bullet points:
        //   "- управление сервоприводами воздушных заслонок;"
        //   "- с возможностью регулирования электродвигателя..."
        // These are equipment features, NOT part of the item name.
        if (trimmed.startsWith("- ") || trimmed.startsWith("– ") || trimmed.startsWith("— ")) return true;

        // ── Lines starting with model/designation codes ──
        // Lines like "ШУП2.1 (ЧРП=электродвигатель...)" are spec details
        if (trimmed.matches("^ШУ[А-ЯЁ]+\\d.*")) return true;

        // ── Explicit note markers ──
        if (lower.startsWith("примечан") || lower.startsWith("прим.:") || lower.startsWith("прим:")) return true;

        // ── Common ГОСТ footnote phrases ──
        if (lower.startsWith("возможна замена") || lower.startsWith("возможна корректировка")) return true;
        if (lower.startsWith("допускается ") || lower.startsWith("по согласованию")) return true;
        if (lower.startsWith("поставляется ") || lower.startsWith("или аналог")) return true;
        if (lower.startsWith("по усмотрению") || lower.startsWith("на аналогичные")) return true;
        if (lower.startsWith("уточнить ") || lower.startsWith("согласно ")) return true;
        if (lower.startsWith("усмотрению ")) return true;
        if (lower.startsWith("аналогичные ") || lower.startsWith("характеристик")) return true;
        if (lower.startsWith("совместимость ") || lower.startsWith("закупк")) return true;
        if (lower.startsWith("согласовать ") || lower.startsWith("рекомендац")) return true;
        if (lower.startsWith("материалов") || lower.startsWith("оборудован")) return true;
        if (lower.startsWith("мощностей ") || lower.startsWith("наращиван")) return true;
        if (lower.startsWith("общества ") || lower.startsWith("института ")) return true;
        if (lower.startsWith("организаци") || lower.startsWith("предприяти")) return true;

        // ── Spec detail phrases that leak from PDF table cells ──
        // Lines like "установлен внутри шкафа;" — installation notes
        if (lower.contains("установлен внутри") || lower.contains("установлен снаружи")) return true;
        // Lines ending with ");" — specification detail fragments
        if (trimmed.endsWith(");")) return true;
        // Technical spec details — voltage, motor, servo
        if (lower.contains("сервоприводом") || lower.contains("сервопривод")) return true;
        if (lower.startsWith("насоса ") || lower.startsWith("вентилятора ")) return true;
        if (lower.startsWith("каждого ")) return true;

        // ── Grammatically incomplete fragments ──
        // Short lowercase-starting lines in specific cases (accusative, genitive, instrumental)
        // that are fragments from notes, not equipment names
        if (lower.startsWith("модификацию ") || lower.startsWith("производителя ")) return true;
        if (lower.startsWith("учетом ") || lower.startsWith("условиям ")) return true;
        if (lower.startsWith("управления, на ") || lower.startsWith("управления.")) return true;
        if (lower.startsWith("автоматизации.") || lower.startsWith("автоматизации ")) return true;
        // Standalone fragment words
        if (lower.equals("эксплуатации.") || lower.equals("эксплуатации")
                || lower.equals("автоматики") || lower.equals("автоматики.")) return true;

        // ── Lines with parenthetical specs ──
        // Lines like "(электродвигатель вытяжного вентилятора 0,9 кВт, 220В)"
        // or "(ЧРП=электродвигатель...)" are specification details
        if (trimmed.startsWith("(") && (lower.contains("квт") || lower.contains("электро")
                || lower.contains("чрп") || lower.contains("двигател"))) return true;

        // ── Numbered note items ──
        // Lines like "1) перед закупкой оборудования..." are numbered notes
        if (trimmed.matches("^\\d+\\)\\s+.*")) return true;

        // ── Document/title references ──
        // Lines starting with « (left angle quote) are document names or references
        if (trimmed.startsWith("«") || trimmed.startsWith("\"Комплекс")) return true;

        // ── ГОСТ column header text that leaked into data ──
        // "Тип, марка, обозначение документа" — column header
        if (lower.contains("тип, марка") || lower.contains("обозначение документа")) return true;
        if (lower.contains("код оборудов") || lower.contains("завод-изготов")) return true;
        if (lower.contains("единиц") && lower.contains("измер")) return true;
        if (lower.contains("поставщик") || lower.contains("спецификация оборуд")) return true;

        return false;
    }

    /**
     * Flushes an accumulated item row into the entries list.
     * <p>
     * The first line preserves its original tab structure so that parseRowTabbed
     * can find unit/qty in the correct columns. Continuation text is inserted
     * into the NAME column (between position and brand) — not after position.
     */
    private void flushRow(List<Object> entries, String firstLine, StringBuilder contText) {
        if (firstLine == null || firstLine.isBlank()) {
            contText.setLength(0);
            return;
        }

        String rowText = firstLine.trim();

        if (contText.length() > 0) {
            String extra = contText.toString().trim();
            // Limit continuation text to prevent spec footnotes from bloating the name.
            // Legitimate name continuations (cable descriptions) are typically < 200 chars.
            // Footnote/specification text that leaked through filters can be 1000+ chars.
            if (extra.length() > 250) {
                extra = extra.substring(0, 250).trim();
            }
            // Match position to find where the name column is
            Matcher pm = POSITION_PATTERN.matcher(rowText);
            if (pm.matches()) {
                String pos = pm.group(1);
                String rest = pm.group(3); // everything after "pos\s+"
                if (rest.contains("\t")) {
                    // Insert continuation after the name column (first \t in rest)
                    int nameEnd = rest.indexOf('\t');
                    rest = rest.substring(0, nameEnd) + " " + extra + rest.substring(nameEnd);
                } else {
                    rest = rest + " " + extra;
                }
                rowText = pos + "\t" + rest;
            } else {
                rowText = rowText + " " + extra;
            }
        }

        if (!rowText.isBlank()) {
            entries.add(rowText);
        }
        contText.setLength(0);
    }
    /**
     * Returns true if a line looks like a section header inside the spec body:
     * - At least 8 and at most 150 chars
     * - Doesn't start with a position number
     * - Mostly uppercase (>= 60% of alpha chars are uppercase), OR matches a known
     *   engineering discipline keyword from SECTION_ABBR dictionary (for ОВ-style
     *   mixed-case headers like "Система отопления жилых помещений")
     * - Contains at least one Cyrillic word >= 4 chars
     * - Has no more than 1 tab (section headers don't have column data)
     */
    private boolean isSectionHeader(String line) {
        int len = line.length();
        if (len < 8 || len > 150) return false;

        // Must not be a stamp or column header line
        if (isStampLine(line) || isColumnHeader(line)) return false;

        // Must not start with a position number
        if (POSITION_PATTERN.matcher(line).matches()) return false;

        // Must not start with bullet/dash/paren or be a fragment of equipment description
        String stripped = line.stripLeading();
        if (stripped.startsWith("-") || stripped.startsWith("–") || stripped.startsWith("•")
                || stripped.startsWith("*") || stripped.startsWith(";")
                || stripped.startsWith("(")) return false;
        // Lines containing ); or ; or ending with ) are continuation fragments, not sections
        if (stripped.contains(");") || stripped.contains(";") || stripped.endsWith(")")) return false;
        // Lines with lowercase first word are fragments, not section headers
        if (Character.isLowerCase(stripped.charAt(0))) return false;

        // Guard: lines starting with "час" (часть/часовой) are description fragments, not sections
        String lowerStripped = stripped.toLowerCase();
        if (lowerStripped.startsWith("час")) return false;

        // Guard: lines containing measurement values like "25мм", "100мм.", "50 мм" are spec text
        if (lowerStripped.matches(".*\\d+\\s*мм\\.?.*")) return false;

        // Guard: short lines (< 15 chars) that contain digits are likely spec fragments, not headers
        if (stripped.length() < 15 && stripped.matches(".*\\d+.*")) return false;

        // Section headers should not have multiple tab-separated columns (that's item data)
        long tabCount = line.chars().filter(c -> c == '\t').count();
        if (tabCount > 1) return false;

        // Must contain at least one Cyrillic word >= 4 chars
        boolean hasCyrillicWord = line.matches(".*[А-ЯЁа-яё]{4,}.*");
        if (!hasCyrillicWord) return false;

        long alphaCount = line.chars().filter(Character::isLetter).count();
        if (alphaCount < 4) return false;

        // Check uppercase ratio
        long upperCount = line.chars().filter(c -> Character.isLetter(c) && Character.isUpperCase(c)).count();
        double upperRatio = (double) upperCount / alphaCount;

        // Primary check: mostly uppercase (traditional ГОСТ headers)
        if (upperRatio >= 0.60) return true;

        // Secondary check: matches a known engineering discipline keyword from SECTION_ABBR.
        // This catches ОВ-style mixed-case section headers like "Система отопления жилых помещений"
        // Extra guards:
        //  - line must start with a Cyrillic letter (not digits, not punctuation, not English)
        //  - must not contain commas with numbers (equipment specs like "1,5 кВт, 380В")
        //  - must not contain units or numbers that indicate an item row
        char firstChar = stripped.charAt(0);
        if (!Character.isLetter(firstChar) || (firstChar >= 'A' && firstChar <= 'z')) return false;
        // Equipment description fragments contain specs like "кВт", "380В", measurements
        if (stripped.matches(".*\\d+[.,]\\d+.*кВт.*") || stripped.matches(".*\\d+В[,;)\\s].*")) return false;

        String upper = line.toUpperCase();
        for (String keyword : SECTION_ABBR.keySet()) {
            if (upper.contains(keyword.toUpperCase())) {
                String lower = line.toLowerCase();
                boolean hasUnit = UNITS.stream().anyMatch(u -> lower.contains(" " + u + " ") || lower.endsWith(" " + u));
                if (!hasUnit) return true;
            }
        }

        return false;
    }

    /**
     * Returns true if a position-matched line is actually a numbered section header.
     * <p>In ГОСТ СО tables, sections are often numbered 1–9 and contain category names
     * (e.g., "1  Приборы и средства автоматизации"), while items have multi-digit
     * positions (11, 12, 21, etc.) and tab-separated column data (brand, code, unit, qty).
     * <p>Section rows in a table may have trailing tabs from empty cells, so we check
     * the number of <em>non-empty</em> tab-separated columns rather than tab count.
     *
     * @param position     the matched position string (e.g. "1")
     * @param restAfterPos the text after position from POSITION_PATTERN group(3)
     * @param rawLine      the original raw line from PDF extraction
     */
    private boolean isNumberedSectionHeader(String position, String restAfterPos, String rawLine) {
        // Section headers have single-digit positions (1-9)
        if (!position.matches("\\d")) return false;

        String rest = restAfterPos.trim();
        if (rest.isEmpty()) return false;

        // Split rest by tabs and count non-empty columns.
        // Section headers: 1 non-empty column (the title text).
        // Items: 3+ non-empty columns (name, brand/code, manufacturer, unit, qty, ...).
        String[] parts = rest.split("\t");
        int nonEmptyCols = 0;
        for (String part : parts) {
            String col = part.trim();
            if (!col.isEmpty()) {
                nonEmptyCols++;
                // If any column is a recognized unit of measure → it's an item, not a section
                if (UNITS.contains(col.toLowerCase())) return false;
                // If any column is purely numeric → it's a quantity → item
                if (col.matches("\\d+([.,]\\d+)?")) return false;
            }
        }

        // Items typically have 3+ non-empty columns; sections have 1-2
        if (nonEmptyCols > 2) return false;

        // The title (first non-empty part) must contain a Cyrillic word ≥ 3 chars
        String title = parts[0].trim();
        return title.matches(".*[А-ЯЁа-яё]{3,}.*");
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

        ParsedSpecItemDto dto;
        if (rest.contains("\t")) {
            dto = parseRowTabbed(position, rest, sectionName);
        } else {
            dto = parseRowSpaced(position, rest, sectionName);
        }
        return dto;
    }

    private ParsedSpecItemDto parseRowTabbed(String position, String rest, String sectionName) {
        String[] rawCols = rest.split("\t");

        // Pre-process: expand columns where unit+qty merged with another field.
        // E.g., "АО «НП «ПОДОЛЬСККАБЕЛЬ» м 60" → ["АО «НП «ПОДОЛЬСККАБЕЛЬ»", "м", "60"]
        String[] cols = expandMergedColumns(rawCols);

        // Two-pass unit column scan:
        // Pass 1: prefer non-mass units (м, шт, компл, пог.м, …) — the actual item unit.
        //         Mass units (кг, т) belong to the «Масса единицы» column and should not
        //         be mistaken for the item unit of measure.
        // Pass 2: fallback to mass units (кг, т) if no non-mass unit found.
        int unitColIdx = -1;
        for (int i = cols.length - 1; i >= 0; i--) {
            String colVal = cols[i].trim().toLowerCase();
            if (UNITS.contains(colVal) && !isMassUnit(colVal)) {
                unitColIdx = i;
                break;
            }
        }
        if (unitColIdx < 0) {
            for (int i = cols.length - 1; i >= 0; i--) {
                if (UNITS.contains(cols[i].trim().toLowerCase())) {
                    unitColIdx = i;
                    break;
                }
            }
        }

        String     parsedName, brand, productCode, manufacturer, unitOfMeasure;
        BigDecimal quantity, mass;
        String     notes;

        // ── Detect continuation-text in cols[0] ──
        // In multi-row ГОСТ items, continuation text from the previous item's description
        // leaks into the first column. The REAL product name appears in cols[1].
        // Heuristic: if cols[0] starts with a lowercase letter (Cyrillic or Latin) and
        // cols[1] starts with an uppercase Cyrillic letter, then cols[0] is continuation.
        if (unitColIdx >= 2 && cols.length > 1) {
            String col0 = cols[0].trim();
            String col1 = cols[1].trim();
            if (!col0.isEmpty() && !col1.isEmpty()) {
                char ch0 = col0.charAt(0);
                char ch1 = col1.charAt(0);
                boolean col0LooksLikeContinuation =
                        Character.isLowerCase(ch0) ||
                        // Also catch fragments starting with special chars or TU codes
                        col0.startsWith("ТУ ") || col0.startsWith("ГОСТ ");
                boolean col1LooksLikeName =
                        Character.isUpperCase(ch1) && col1.length() >= 5;

                if (col0LooksLikeContinuation && col1LooksLikeName) {
                    // Merge continuation into the real name: "Кабель... композиций..."
                    String merged = col1 + " " + col0;
                    String[] shifted = new String[cols.length - 1];
                    shifted[0] = merged;
                    System.arraycopy(cols, 2, shifted, 1, cols.length - 2);
                    cols = shifted;
                    unitColIdx--;
                    log.debug("Shifted continuation col0→col1 for pos={}: merged=[{}]",
                            position, merged.length() > 80 ? merged.substring(0, 80) + "..." : merged);
                }
            }
        }

        // Final reference for use in lambdas (cols may have been reassigned above)
        final String[] finalCols = cols;

        if (unitColIdx >= 0) {
            parsedName   = unitColIdx > 0 ? finalCols[0].trim() : "";

            // Columns between name (0) and unit (unitColIdx) map to: brand, code, manufacturer.
            // ГОСТ order: [name] [brand/type] [code] [manufacturer] [unit] [qty] [mass] [notes]
            // But when PDF columns collapse, fewer columns appear. Use smart assignment:
            int preUnitCols = unitColIdx;  // number of columns before the unit column (including name at 0)
            if (preUnitCols == 1) {
                // Only name before unit
                brand = null;
                productCode = null;
                manufacturer = null;
            } else if (preUnitCols == 2) {
                // One column between name and unit — could be brand or manufacturer
                String val = finalCols[1].trim();
                // Try to split merged brand+TU
                String[] splitResult = splitBrandAndTuCode(val);
                if (splitResult != null) {
                    brand = splitResult[0];
                    productCode = splitResult[1];
                    manufacturer = null;
                } else if (looksLikeManufacturer(val)) {
                    brand = null;
                    productCode = null;
                    manufacturer = val;
                } else {
                    brand = val;
                    productCode = null;
                    manufacturer = null;
                }
            } else if (preUnitCols == 3) {
                // Two columns between name and unit — could be:
                //   [brand, manufacturer] or [brand, code] or [code, manufacturer]
                // GOST order: col1=brand/type/doc (col 3), col2=code (col 4)
                String val1 = finalCols[1].trim();
                String val2 = finalCols[2].trim();

                // First, try to split merged brand+TU cells:
                // e.g. val1="СОН 12/3 ТУ2540-001-76099751-2005" → brand="СОН 12/3", code="ТУ2540..."
                String[] splitResult = splitBrandAndTuCode(val1);
                if (splitResult != null) {
                    brand = splitResult[0];
                    productCode = splitResult[1];
                    manufacturer = val2.isEmpty() ? null : val2;
                } else if (looksLikeBrandDesignation(val1)) {
                    // val1 is a brand/type/TU designation (col 3)
                    brand = val1;
                    if (looksLikeManufacturer(val2)) {
                        productCode = null;
                        manufacturer = val2;
                    } else if (looksLikeProductCode(val2)) {
                        productCode = val2;
                        manufacturer = null;
                    } else {
                        productCode = val2;
                        manufacturer = null;
                    }
                } else if (looksLikeProductCode(val1) && looksLikeManufacturer(val2)) {
                    // val1 is a catalog code (col 4), val2 is manufacturer (col 5)
                    // Brand column (col 3) was empty in the PDF, so columns shifted left
                    brand = null;
                    productCode = val1;
                    manufacturer = val2;
                } else if (looksLikeManufacturer(val2)) {
                    brand = val1;
                    productCode = null;
                    manufacturer = val2;
                } else if (looksLikeProductCode(val1) && !looksLikeProductCode(val2)) {
                    // val1 is a genuine catalog code, val2 is manufacturer
                    brand = null;
                    productCode = val1;
                    manufacturer = val2.isEmpty() ? null : val2;
                } else if (looksLikeProductCode(val2)) {
                    brand = val1;
                    productCode = val2;
                    manufacturer = null;
                } else {
                    // Default: GOST order — first is brand (col 3), second is code (col 4)
                    brand = val1;
                    productCode = val2;
                    manufacturer = null;
                }
            } else if (preUnitCols == 4) {
                // Three columns between name and unit — GOST order: brand + code + manufacturer
                String v1 = finalCols[1].trim();
                String v2 = finalCols[2].trim();
                String v3 = finalCols[3].trim();

                // Try to split merged brand+TU in v1
                String[] splitResult = splitBrandAndTuCode(v1);
                if (splitResult != null) {
                    brand = splitResult[0];
                    productCode = splitResult[1];
                    manufacturer = (v2 + " " + v3).trim();
                } else if (looksLikeBrandDesignation(v1)) {
                    // v1 is brand/type/TU (col 3) — GOST order: brand, code, manufacturer
                    brand = v1;
                    productCode = v2;
                    manufacturer = v3;
                } else if (looksLikeProductCode(v1) && !looksLikeBrandDesignation(v2)) {
                    // v1 is a genuine catalog code, not brand
                    brand = null;
                    productCode = v1;
                    manufacturer = (v2 + " " + v3).trim();
                } else {
                    // Default GOST order
                    brand = v1;
                    productCode = v2;
                    manufacturer = v3;
                }
            } else {
                // 4+ columns — brand, code, then join rest as manufacturer
                brand = finalCols[1].trim();
                productCode = finalCols[2].trim();
                manufacturer = IntStream.range(3, unitColIdx)
                        .mapToObj(i -> finalCols[i].trim())
                        .filter(s -> !s.isEmpty())
                        .collect(Collectors.joining(" "));
            }

            unitOfMeasure = finalCols[unitColIdx].trim();
            String qtyStr  = get(finalCols, unitColIdx + 1);
            String mass1Str = get(finalCols, unitColIdx + 2);
            String mass2Str = get(finalCols, unitColIdx + 3);

            // Try parsing quantity; if full string isn't numeric, extract leading number
            // (handles cases like "60 композиций, не содержащих галогенов..." → 60)
            quantity = tryParseBigDecimal(qtyStr, null);
            if (quantity == null && qtyStr != null && !qtyStr.isBlank()) {
                quantity = extractLeadingNumber(qtyStr);
            }
            if (quantity == null) {
                quantity = BigDecimal.ONE;
            }
            boolean hasMass1 = isNumeric(mass1Str);
            boolean hasMass2 = isNumeric(mass2Str);
            mass = hasMass1 ? tryParseBigDecimal(mass1Str, null) : null;

            int notesStart = unitColIdx + (hasMass2 ? 4 : (hasMass1 ? 3 : 2));
            if (notesStart < finalCols.length) {
                String raw = IntStream.range(notesStart, finalCols.length)
                        .mapToObj(i -> finalCols[i].trim())
                        .filter(s -> !s.isEmpty())
                        .collect(Collectors.joining(" "));
                notes = raw.isEmpty() ? null : raw;
            } else {
                notes = null;
            }
        } else {
            parsedName   = finalCols[0].trim();
            brand        = finalCols.length > 1 ? finalCols[1].trim() : null;
            productCode  = finalCols.length > 2 ? finalCols[2].trim() : null;
            manufacturer = finalCols.length > 3
                    ? IntStream.range(3, finalCols.length).mapToObj(i -> finalCols[i].trim())
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

    /**
     * Expands tab-separated columns where the PDF's narrow column gaps caused
     * unit-of-measure and quantity values to be merged into an adjacent field.
     *
     * <p>For example, when the ColumnAwareStripper produces
     * {@code "АО «НП «ПОДОЛЬСККАБЕЛЬ»\tм 60"} or
     * {@code "АО «НП «ПОДОЛЬСККАБЕЛЬ» м 60"}, this method splits the merged
     * column into separate {@code ["АО «НП «ПОДОЛЬСККАБЕЛЬ»", "м", "60"]}
     * so the two-pass unit scan in {@link #parseRowTabbed} can find them.
     *
     * <p>Three patterns are recognized per column:
     * <ol>
     *   <li>{@code "prefix unit number"} — e.g. "ПОДОЛЬСККАБЕЛЬ» м 60"</li>
     *   <li>{@code "unit number"} — e.g. "м 60" (column is just unit+qty)</li>
     *   <li>{@code "prefix unit"} — e.g. "ПОДОЛЬСККАБЕЛЬ» м" (qty in next column)</li>
     * </ol>
     */
    private String[] expandMergedColumns(String[] cols) {
        List<String> expanded = new ArrayList<>();
        for (String col : cols) {
            String trimmed = col.trim();
            if (trimmed.isEmpty()) {
                expanded.add(trimmed);
                continue;
            }

            boolean didExpand = false;

            for (String unit : RESCUE_UNITS) {
                if (isMassUnit(unit)) continue; // skip кг/т — belongs to mass column

                // Pattern 1: "prefix unit number" — split into [prefix, unit, number]
                // Use case-insensitive matching for the unit
                String quotedUnit = Pattern.quote(unit);
                Pattern p1 = Pattern.compile(
                        "^(.+?)\\s+(" + quotedUnit + "\\.?)\\s+(\\d+(?:[.,]\\d+)?)\\s*$",
                        Pattern.CASE_INSENSITIVE);
                Matcher m1 = p1.matcher(trimmed);
                if (m1.matches()) {
                    expanded.add(m1.group(1).trim());
                    expanded.add(m1.group(2).trim());
                    expanded.add(m1.group(3).trim());
                    didExpand = true;
                    break;
                }

                // Pattern 2: "unit number" — column is just unit + qty
                Pattern p2 = Pattern.compile(
                        "^(" + quotedUnit + "\\.?)\\s+(\\d+(?:[.,]\\d+)?)\\s*$",
                        Pattern.CASE_INSENSITIVE);
                Matcher m2 = p2.matcher(trimmed);
                if (m2.matches()) {
                    expanded.add(m2.group(1).trim());
                    expanded.add(m2.group(2).trim());
                    didExpand = true;
                    break;
                }

                // Pattern 3: "prefix unit" — qty will be in the next column
                if (trimmed.toLowerCase().endsWith(" " + unit.toLowerCase())) {
                    String prefix = trimmed.substring(0, trimmed.length() - unit.length() - 1).trim();
                    if (!prefix.isEmpty() && prefix.length() >= 2) {
                        expanded.add(prefix);
                        expanded.add(unit);
                        didExpand = true;
                        break;
                    }
                }
            }

            if (!didExpand) {
                expanded.add(trimmed);
            }
        }
        return expanded.toArray(new String[0]);
    }

    private ParsedSpecItemDto parseRowSpaced(String position, String rest, String sectionName) {
        String[] tokens = rest.split("\\s+");

        // Two-pass: prefer non-mass units, fallback to mass units
        int unitIdx = -1;
        for (int i = tokens.length - 1; i >= 0; i--) {
            String tok = tokens[i].toLowerCase();
            if (UNITS.contains(tok) && !isMassUnit(tok)) {
                unitIdx = i;
                break;
            }
        }
        if (unitIdx < 0) {
            for (int i = tokens.length - 1; i >= 0; i--) {
                if (UNITS.contains(tokens[i].toLowerCase())) {
                    unitIdx = i;
                    break;
                }
            }
        }

        String     parsedName, brand = null, productCode = null, manufacturer = null;
        String     unitOfMeasure;
        BigDecimal quantity, mass = null;
        String     notes = null;

        if (unitIdx >= 0) {
            String nameText   = String.join(" ", Arrays.copyOfRange(tokens, 0, unitIdx)).trim();
            unitOfMeasure     = tokens[unitIdx];
            String qtyToken   = get(tokens, unitIdx + 1);
            quantity          = tryParseBigDecimal(qtyToken, null);
            if (quantity == null && qtyToken != null && !qtyToken.isBlank()) {
                quantity = extractLeadingNumber(qtyToken);
            }
            if (quantity == null) {
                quantity = BigDecimal.ONE;
            }
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
            "подп. и дата", "подп.и дата", "подп. и  дата",
            "взаим. инв.", "инв. № подл.", "инв. №подл.", "инв. № подп.",
            "инв. № дубл.", "инв. №дубл.", "инв. №",
            "спецификация оборудования,",
            "подразд.", "подраздел",
            "формат а3", "формат а4", "формат а2", "формат а1",
            "лист 1", "листов",
            "гл.спец", "нач. отд", "гип ",
            "тип, марка, обозначение документа",
            "код оборудования",
            "опросного листа",
            "масса единицы"
    );

    /** Pattern for project codes like "1218-Д00100.2/25-Р-АОВ1.1" */
    private static final Pattern PROJECT_CODE_PATTERN = Pattern.compile(
            "\\d{4}-[А-ЯЁA-Z]\\d{4,}");

    private String cleanStampText(String raw) {
        if (raw == null || raw.isBlank()) return null;
        // Normalize non-breaking spaces (NBSP, U+00A0) and other whitespace to regular spaces
        // PDFs often use NBSP between "Инв." and "№" in stamp text
        String normalized = raw.replace('\u00A0', ' ')
                .replace('\u2007', ' ')  // figure space
                .replace('\u2009', ' ')  // thin space
                .replace('\u200A', ' ')  // hair space
                .replace('\u202F', ' '); // narrow no-break space
        String lower = normalized.toLowerCase();

        // Find the EARLIEST stamp term occurrence across ALL terms.
        // Previous bug: returning on first LIST match caused later-occurring terms
        // (like "подп. и дата") to be found before earlier ones (like "инв. № подп."),
        // leaving "Инв. № подп." in the text.
        int earliestIdx = -1;
        for (String term : STAMP_TERMS) {
            int idx = lower.indexOf(term);
            if (idx >= 0 && (earliestIdx < 0 || idx < earliestIdx)) {
                earliestIdx = idx;
            }
        }
        if (earliestIdx >= 0) {
            String before = normalized.substring(0, earliestIdx).trim();
            return before.isEmpty() ? null : before;
        }
        // Project code pattern (e.g. "1218-Д00100.2/25-Р-АОВ1.1.СО") indicates stamp text
        Matcher projMatch = PROJECT_CODE_PATTERN.matcher(normalized);
        if (projMatch.find()) {
            String before = normalized.substring(0, projMatch.start()).trim();
            return before.isEmpty() ? null : before;
        }
        // If it looks like a page-number + project-header line (starts with digits like "0.19 ...")
        // and is very long, it's likely stamp text
        if (normalized.matches("^\\d+\\.\\d+\\s+.*") && normalized.length() > 40) return null;
        // Truncate extremely long notes (> 300 chars) — almost certainly corrupt
        if (normalized.length() > 300) return normalized.substring(0, 300).trim();
        return normalized;
    }

    // ─── Unit / Quantity rescue ────────────────────────────────────────────────
    // When PDF column boundaries are too narrow (esp. for "м"), the unit and
    // quantity may end up inside adjacent fields.  These helpers detect and
    // fix such cases.

    /** Rescued unit/quantity extracted from incorrectly assigned fields. */
    private record RescuedUnitQty(String unit, BigDecimal quantity,
                                   String cleanedBrand, String cleanedProductCode,
                                   String cleanedManufacturer) {}

    /** Non-mass units ordered longest-first to avoid partial matches. */
    private static final List<String> RESCUE_UNITS = List.of(
            "компл.", "компл", "пог.м.", "пог.м", "п.м.", "п.м", "пм",
            "шт.", "шт", "м3", "м³", "м2", "м²", "м.", "м",
            "л.", "л", "уп.", "уп", "рул.", "рул", "мп.", "мп",
            "пара.", "пара", "лист.", "лист"
    );

    /**
     * Attempts to extract the correct unit of measure and quantity from fields
     * where they got merged due to narrow PDF column boundaries.
     *
     * <p>Common patterns in ГОСТ spec PDFs (especially for cables and wires):
     * <ul>
     *   <li>Pattern A: {@code productCode = "шт"}, {@code manufacturer = "29"} →
     *       unit = "шт", qty = 29</li>
     *   <li>Pattern B: {@code manufacturer = "м 60 ООО Компания..."} →
     *       unit = "м", qty = 60, manufacturer = "ООО Компания..."</li>
     *   <li>Pattern C: {@code brand = "Сегмент Энерго м"}, {@code productCode = "350"} →
     *       unit = "м", qty = 350, brand = "Сегмент Энерго"</li>
     * </ul>
     *
     * @return rescued data, or {@code null} if no rescue pattern matched
     */
    private RescuedUnitQty rescueUnitAndQuantity(String brand, String productCode,
                                                  String manufacturer) {

        // Pattern A: productCode is exactly a unit, manufacturer starts with a number
        if (productCode != null) {
            String pcLower = productCode.trim().toLowerCase();
            if (UNITS.contains(pcLower) && !isMassUnit(pcLower)) {
                BigDecimal qty = extractLeadingNumber(manufacturer);
                if (qty != null) {
                    String remainingMfg = stripLeadingNumber(manufacturer);
                    return new RescuedUnitQty(productCode.trim(), qty, brand, null,
                            blankToNull(remainingMfg));
                }
            }
        }

        // Pattern B: manufacturer starts with "unit number ..." (e.g. "м 60 ООО Кабель")
        if (manufacturer != null) {
            String mfgTrimmed = manufacturer.trim();
            for (String unit : RESCUE_UNITS) {
                String mfgLower = mfgTrimmed.toLowerCase();
                if (mfgLower.startsWith(unit + " ") || mfgLower.equals(unit)) {
                    String afterUnit = mfgTrimmed.substring(unit.length()).trim();
                    BigDecimal qty = extractLeadingNumber(afterUnit);
                    if (qty != null) {
                        String remaining = stripLeadingNumber(afterUnit);
                        return new RescuedUnitQty(unit, qty, brand, productCode,
                                blankToNull(remaining));
                    }
                }
            }
        }

        // Pattern C: brand ends with " unit", productCode STARTS with a number
        // (e.g. brand = «Сегмент Энерго» м, productCode = "350 композиций…")
        if (brand != null && productCode != null) {
            String brandTrimmed = brand.trim();
            for (String unit : RESCUE_UNITS) {
                if (brandTrimmed.toLowerCase().endsWith(" " + unit)) {
                    BigDecimal qty = extractLeadingNumber(productCode);
                    if (qty != null) {
                        String cleanBrand = brandTrimmed.substring(0,
                                brandTrimmed.length() - unit.length() - 1).trim();
                        String remainingCode = stripLeadingNumber(productCode);
                        return new RescuedUnitQty(unit, qty,
                                cleanBrand.isEmpty() ? null : cleanBrand,
                                blankToNull(remainingCode), manufacturer);
                    }
                }
            }
        }

        // Pattern D: any field ends with " unit number" (caught after expandMergedColumns
        // may fail for space-separated text).  Scan productCode, then manufacturer, then brand.
        String[] fieldsToScan = { productCode, manufacturer, brand };
        int fieldIdx = 0;
        for (String field : fieldsToScan) {
            if (field == null || field.isBlank()) { fieldIdx++; continue; }
            String fieldTrimmed = field.trim();
            for (String unit : RESCUE_UNITS) {
                if (isMassUnit(unit)) continue;
                Pattern p = Pattern.compile(
                        "^(.+?)\\s+" + Pattern.quote(unit) + "\\.?\\s+(\\d+(?:[.,]\\d+)?)\\s*$",
                        Pattern.CASE_INSENSITIVE);
                Matcher match = p.matcher(fieldTrimmed);
                if (match.matches()) {
                    String remaining = match.group(1).trim();
                    BigDecimal qty = tryParseBigDecimal(match.group(2).trim(), null);
                    if (qty != null) {
                        String newBrand = brand, newCode = productCode, newMfg = manufacturer;
                        if (fieldIdx == 0)      newCode = blankToNull(remaining);
                        else if (fieldIdx == 1)  newMfg  = blankToNull(remaining);
                        else                     newBrand = blankToNull(remaining);
                        return new RescuedUnitQty(unit, qty, newBrand, newCode, newMfg);
                    }
                }
            }
            fieldIdx++;
        }

        return null;
    }

    private BigDecimal extractLeadingNumber(String s) {
        if (s == null || s.isBlank()) return null;
        Matcher m = Pattern.compile("^(\\d+([.,]\\d+)?)").matcher(s.trim());
        return m.find() ? tryParseBigDecimal(m.group(1), null) : null;
    }

    private String stripLeadingNumber(String s) {
        if (s == null || s.isBlank()) return null;
        return s.trim().replaceFirst("^\\d+([.,]\\d+)?\\s*", "").trim();
    }

    // ─── DTO builder ────────────────────────────────────────────────────────────

    private ParsedSpecItemDto buildDto(
            String position, String parsedName,
            String brand, String productCode, String manufacturer,
            String unitOfMeasure, BigDecimal quantity, BigDecimal mass,
            String notes, String sectionName) {

        if (parsedName == null || parsedName.isBlank()) return null;

        // Reject garbage items: name must contain at least one meaningful Cyrillic word (≥ 3 chars)
        if (!parsedName.matches(".*[А-ЯЁа-яё]{3,}.*")) {
            log.debug("Rejected garbage item pos={}: name={}", position, parsedName);
            return null;
        }

        // Strip stamp text from all fields and also from name
        parsedName   = cleanStampText(parsedName);
        if (parsedName == null || parsedName.isBlank()) return null;
        brand        = blankToNull(cleanStampText(brand));
        productCode  = blankToNull(productCode);
        manufacturer = blankToNull(cleanStampText(manufacturer));
        notes        = blankToNull(cleanStampText(notes));
        sectionName  = blankToNull(sectionName);

        // ── Rescue unit/quantity from fields when PDF columns were too narrow ──
        // Triggers when quantity fell back to 1 (likely wrong) or unit is a mass
        // unit (кг/т) which usually belongs to the mass column, not the item unit.
        boolean needsRescue = (quantity != null && quantity.compareTo(BigDecimal.ONE) == 0)
                || isMassUnit(unitOfMeasure);
        if (needsRescue) {
            RescuedUnitQty rescued = rescueUnitAndQuantity(brand, productCode, manufacturer);
            if (rescued != null) {
                log.debug("Rescued unit/qty for pos {}: unit={}, qty={}", position,
                        rescued.unit(), rescued.quantity());
                unitOfMeasure = rescued.unit();
                quantity      = rescued.quantity();
                brand         = blankToNull(rescued.cleanedBrand());
                productCode   = blankToNull(rescued.cleanedProductCode());
                manufacturer  = blankToNull(rescued.cleanedManufacturer());
            }
        }

        // ── Fix brand/manufacturer swap when empty columns collapse in PDF ──
        // In ГОСТ tables, columns 2 (brand) and 3 (code) may be empty, causing
        // the manufacturer (column 5) to appear right after name (column 1).
        // The parser then misassigns manufacturer into brand.
        // Detect and fix: if brand looks like a company name and manufacturer is null.
        if (brand != null && manufacturer == null && looksLikeManufacturer(brand)) {
            manufacturer = brand;
            brand = null;
        }
        // ── Split brand+manufacturer when both merged into brand ──
        // Example: brand="SR300 \"ВЕЗА\", Россия" → brand="SR300", manufacturer="\"ВЕЗА\", Россия"
        if (brand != null) {
            int quoteIdx = brand.indexOf('"');
            if (quoteIdx < 0) quoteIdx = brand.indexOf('«');
            if (quoteIdx > 0) {
                String possibleBrand = brand.substring(0, quoteIdx).trim();
                String possibleMfr   = brand.substring(quoteIdx).trim();
                // Only split if the prefix is a real brand code (alphanumeric, ≥2 chars)
                if (possibleBrand.length() >= 2 && possibleMfr.length() >= 3
                        && !looksLikeManufacturer(possibleBrand)) {
                    brand = possibleBrand;
                    if (manufacturer == null) {
                        manufacturer = possibleMfr;
                    }
                }
            }
        }
        // Also: if productCode looks like a manufacturer and manufacturer is null
        if (productCode != null && manufacturer == null && looksLikeManufacturer(productCode)) {
            manufacturer = productCode;
            productCode = null;
        }

        // ── Fix ТУ/ГОСТ in productCode → should be in brand ──
        // ТУ/ГОСТ references are document designations (col 3 = brand), not catalog codes (col 4).
        // If productCode contains a ТУ/ГОСТ reference and brand is null, move it to brand.
        if (productCode != null && brand == null && looksLikeBrandDesignation(productCode)) {
            brand = productCode;
            productCode = null;
        }
        // If productCode is a brand designation but brand is already set, try to split
        // or append to brand
        if (productCode != null && brand != null && looksLikeBrandDesignation(productCode)
                && !looksLikeProductCode(productCode)) {
            // productCode is really part of brand/document designation chain
            // Keep the more specific model name as brand, move ТУ/ГОСТ to productCode only
            // if productCode is a standalone ТУ/ГОСТ reference
            String pcUpper = productCode.trim().toUpperCase();
            if (pcUpper.startsWith("ТУ") || pcUpper.startsWith("ГОСТ")) {
                // ТУ/ГОСТ reference mistakenly in code — it's actually a document designation
                // In GOST table, both brand AND ТУ can be in col 3
                // Keep brand as-is, merge ТУ/ГОСТ into brand
                brand = brand + " " + productCode;
                productCode = null;
            }
        }

        // ── Split brand when it contains both model name and ТУ/ГОСТ ──
        // e.g. brand="СОН 12/3 ТУ2540-001-76099751-2005" → brand="СОН 12/3", code="ТУ2540..."
        if (brand != null && productCode == null) {
            String[] splitResult = splitBrandAndTuCode(brand);
            if (splitResult != null) {
                brand = splitResult[0];
                productCode = splitResult[1];
            }
        }

        // ── Extract cable brand embedded in name ──
        // When PDF column gaps are too narrow, cable brand codes like "КПСЭнг(А)-FRHF"
        // or "МКЭШВнг(А)-HF 2х2х1" get merged into the name text.
        // Detect and extract them into brand when brand is empty.
        if (brand == null && parsedName != null) {
            String[] extracted = extractEmbeddedCableBrand(parsedName);
            if (extracted != null) {
                parsedName = extracted[0];
                brand = blankToNull(extracted[1]);
            }
        }

        // ── Strip CID garbage text ──
        // Some PDFs have CID-encoded fonts that produce garbage like ". N . . .N : 1.1, 2.1"
        // Detect and truncate at the garbage boundary.
        parsedName = stripCidGarbage(parsedName);
        if (parsedName == null || parsedName.isBlank()) return null;
        notes = stripCidGarbage(notes);

        // ── Strip trailing "Россия" from name ──
        // Cable descriptions sometimes have "  Россия" leaked from manufacturer column
        parsedName = parsedName.replaceAll("\\s{2,}Россия\\s*$", "").trim();

        // ── Strip trailing punctuation ──
        // Names ending with "," or ";" from column boundaries
        parsedName = parsedName.replaceAll("[,;]+\\s*$", "").trim();

        // ── Strip leading article numbers from manufacturer ──
        // e.g. "91525 \"DKC\" Россия" → "\"DKC\" Россия"
        if (manufacturer != null && manufacturer.matches("^\\d{3,}\\s+.*")) {
            String mfrCleaned = manufacturer.replaceFirst("^\\d+\\s+", "").trim();
            if (looksLikeManufacturer(mfrCleaned)) {
                manufacturer = mfrCleaned;
            }
        }

        // ── Clean orphaned note fragments ──
        // Notes like "эксплуатации.", "условиям применения", "управления, на аналогичные, с"
        // are fragments from wrapped ГОСТ notes that don't carry useful information.
        if (notes != null) {
            String notesLower = notes.trim().toLowerCase();
            boolean isFragment =
                    notesLower.endsWith(".") && !notesLower.contains(" ") && notesLower.length() < 25  // single word
                    || (notesLower.startsWith("управления") && notesLower.length() < 40)
                    || (notesLower.startsWith("условиям") && notesLower.length() < 40)
                    || notesLower.equals("эксплуатации.")
                    || notesLower.equals("автоматики.")
                    || notesLower.equals("автоматики");
            if (isFragment) {
                notes = null;
            }
        }

        // ── Clean manufacturer leak from name ──
        // Sometimes manufacturer text like '"ВЕЗА", Россия' leaks into name via continuation.
        // Only strip if the quoted text is clearly a company (contains country/city/legal form),
        // NOT just any quoted text (e.g. "Пуск", "СТОП ОГОНЬ" are product names).
        if (parsedName.contains("\"") && manufacturer != null) {
            int mfrQuoteIdx = parsedName.indexOf('"');
            if (mfrQuoteIdx > 0) {
                String afterQuote = parsedName.substring(mfrQuoteIdx);
                String afterLower = afterQuote.toLowerCase();
                // Only strip if it clearly looks like a company (has country/city/legal form)
                boolean isMfrText = afterLower.contains("россия") || afterLower.contains(", рф")
                        || afterLower.contains("г.") || afterLower.contains("г. ")
                        || LEGAL_ENTITY.matcher(afterQuote).find();
                if (isMfrText) {
                    parsedName = parsedName.substring(0, mfrQuoteIdx).trim();
                    parsedName = parsedName.replaceAll("[,;\\s]+$", "").trim();
                }
            }
        }

        String itemType = detectItemType(parsedName, brand);

        return new ParsedSpecItemDto(
                position, itemType, parsedName,
                brand, productCode, manufacturer,
                unitOfMeasure, quantity, mass, notes,
                sectionName
        );
    }

    // ─── Column heuristics ───────────────────────────────────────────────────

    /** Pattern for Russian legal entity prefixes (ООО, АО, ЗАО, ОАО, ПАО, ИП). */
    private static final Pattern LEGAL_ENTITY = Pattern.compile(
            "(?i)(ООО|ОАО|ЗАО|ПАО|АО|ИП|НПФ|НПО|НПП|ФГУП|МУП|ГУП)\\s");

    /**
     * Returns true if a string looks more like a manufacturer/company name
     * than a technical brand or model identifier.
     * <p>
     * Manufacturer indicators: quoted names ("Веза"), country names (Россия),
     * legal entity prefixes (ООО, АО, ЗАО), city references (г.Москва).
     */
    private boolean looksLikeManufacturer(String s) {
        if (s == null || s.length() < 3) return false;
        String trimmed = s.trim();
        // Brand designations (model names, ТУ/ГОСТ references) are NOT manufacturers
        if (looksLikeBrandDesignation(trimmed)) return false;
        // Catalog codes are NOT manufacturers
        if (looksLikeProductCode(trimmed)) return false;
        // Quoted company names: "Веза", «ПОДОЛЬСККАБЕЛЬ»
        if (trimmed.startsWith("\"") || trimmed.startsWith("«") || trimmed.startsWith("'")) return true;
        // Legal entity forms
        if (LEGAL_ENTITY.matcher(trimmed).find()) return true;
        // Country / city suffixes
        String lower = trimmed.toLowerCase();
        if (lower.endsWith("россия") || lower.endsWith(", россия")
                || lower.contains("г.") || lower.contains("г. ")
                || lower.contains(", рф")) return true;
        // Well-known manufacturer phrases
        if (lower.startsWith("завод") || lower.startsWith("фабрик")
                || lower.startsWith("комбинат") || lower.startsWith("концерн")) return true;
        return false;
    }

    /**
     * Returns true if a string looks like a product/catalog code (col 4 in GOST table).
     * <p>
     * Col 4 "Код оборудования, изделия, материала" contains article/catalog numbers:
     * ABA00003, ABA00104, С2000-СП4/220, 91525, 532211, 503320, 54525.
     * <p>
     * NOTE: ТУ/ГОСТ references belong in col 3 (brand/document designation), NOT here.
     * Cyrillic model names (ДТС405Л, ШПС-24, КПС) also belong in col 3 (brand).
     */
    private boolean looksLikeProductCode(String s) {
        if (s == null || s.length() < 2) return false;
        String trimmed = s.trim();
        String upper = trimmed.toUpperCase();
        // ТУ / ГОСТ references are document designations → brand (col 3), NOT product code
        if (upper.startsWith("ТУ ") || upper.startsWith("ТУ-") || upper.startsWith("ТУ2")
                || upper.startsWith("ГОСТ ") || upper.startsWith("ГОСТ-") || upper.startsWith("ГОСТ Р")
                || upper.matches("^ТУ\\d+.*")) return false;
        // Cyrillic model names with numbers (ДТС405Л, ШПС-24, КПСЭнг, СРК-DiM) → brand
        if (looksLikeBrandDesignation(trimmed)) return false;
        // Pure numeric codes (5+ digits): 91525, 532211, 503320
        if (upper.matches("^\\d{5,}$")) return true;
        // Alphanumeric article codes: ABA00003, ABA00104 (Latin letters + digits, no Cyrillic words)
        if (upper.matches("^[A-Z]{1,4}\\d{4,}[A-Z0-9]*$")) return true;
        // Codes like С2000-СП4/220 (Cyrillic letter + digits + dash/slash + alphanumeric)
        // These are catalog article numbers, short and structured
        if (upper.matches("^[А-ЯA-Z]\\d{3,}[\\-/].*") && trimmed.length() <= 20) return true;
        // Short numeric codes with dashes: 54525, 503320
        if (upper.matches("^\\d{4,}[\\-]?\\d*$")) return true;
        return false;
    }

    /**
     * Returns true if a string looks like a brand/type/document designation (col 3 in GOST table).
     * <p>
     * Col 3 "Тип, марка, обозначение документа" contains:
     * - Model names: PTC30-3M-FH, SR300, SR1500, AF-X, СРК-DiM
     * - Cyrillic model names with numbers: ДТС405Л-Рt1000, ШПС-24, КПСЭнг(А)-FRHF
     * - ТУ/ГОСТ document designations: ТУ2247-008-47022248-2002, ГОСТ 30494-2011
     */
    private boolean looksLikeBrandDesignation(String s) {
        if (s == null || s.length() < 2) return false;
        String trimmed = s.trim();
        String upper = trimmed.toUpperCase();
        // ТУ / ГОСТ references → always brand (col 3)
        if (upper.startsWith("ТУ ") || upper.startsWith("ТУ-") || upper.startsWith("ТУ2")
                || upper.matches("^ТУ\\d+.*")
                || upper.startsWith("ГОСТ ") || upper.startsWith("ГОСТ-") || upper.startsWith("ГОСТ Р")) return true;
        // Contains ТУ or ГОСТ anywhere → brand
        if (upper.contains(" ТУ") || upper.contains(" ГОСТ") || upper.matches(".*ТУ\\d+.*")) return true;
        // Cyrillic model names with numbers: ДТС405, ШПС-24, КПС, СРК, etc.
        // Pattern: starts with 2+ Cyrillic letters, followed by digits
        if (trimmed.matches("^[А-ЯЁа-яё]{2,}\\d+.*")) return true;
        // Mixed Cyrillic-Latin model codes with parentheses: КПСЭнг(А)-FRHF
        if (trimmed.matches(".*[А-ЯЁа-яё]+.*нг\\(.*")) return true;
        // Cyrillic abbreviation + dash + number: ШПС-24, СОН-12
        if (trimmed.matches("^[А-ЯЁ]{2,}[\\-]\\d+.*")) return true;
        return false;
    }

    // ─── Brand + ТУ/ГОСТ splitting ─────────────────────────────────────────

    /** Pattern to split merged brand+TU/GOST cells like "СОН 12/3 ТУ2540-001-76099751-2005" */
    private static final Pattern BRAND_TU_SPLIT_PATTERN = Pattern.compile(
            "^(.+?)\\s+(ТУ\\s*\\d[\\d\\-\\.А-ЯЁа-яёA-Za-z]*)\\s*$",
            Pattern.CASE_INSENSITIVE);

    private static final Pattern BRAND_GOST_SPLIT_PATTERN = Pattern.compile(
            "^(.+?)\\s+(ГОСТ\\s*(?:Р\\s*)?\\d[\\d\\-\\.А-ЯЁа-яёA-Za-z]*)\\s*$",
            Pattern.CASE_INSENSITIVE);

    /**
     * Splits a merged brand+ТУ/ГОСТ cell value into [brand, code].
     * <p>
     * Example: "СОН 12/3 ТУ2540-001-76099751-2005" → ["СОН 12/3", "ТУ2540-001-76099751-2005"]
     * Example: "Кабель ВВГ ГОСТ 31996-2012" → ["Кабель ВВГ", "ГОСТ 31996-2012"]
     *
     * @return {@code [brand, code]} or {@code null} if no split pattern matched
     */
    private String[] splitBrandAndTuCode(String value) {
        if (value == null || value.length() < 5) return null;
        String trimmed = value.trim();

        // Try ТУ split
        Matcher tuMatcher = BRAND_TU_SPLIT_PATTERN.matcher(trimmed);
        if (tuMatcher.matches()) {
            String brandPart = tuMatcher.group(1).trim();
            String codePart = tuMatcher.group(2).trim();
            if (brandPart.length() >= 2 && codePart.length() >= 5) {
                return new String[]{brandPart, codePart};
            }
        }

        // Try ГОСТ split
        Matcher gostMatcher = BRAND_GOST_SPLIT_PATTERN.matcher(trimmed);
        if (gostMatcher.matches()) {
            String brandPart = gostMatcher.group(1).trim();
            String codePart = gostMatcher.group(2).trim();
            if (brandPart.length() >= 2 && codePart.length() >= 5) {
                return new String[]{brandPart, codePart};
            }
        }

        return null;
    }

    // ─── Cable brand extraction ─────────────────────────────────────────────

    /**
     * Pattern for cable brand codes commonly embedded in the name column.
     * Matches Russian cable brand designations like:
     * - ППГнг(А)-HF, КППГнг(А)-HF, МКШВнг(А)-HF, МКЭШВнг(А)-HF
     * - КПСЭнг(А)-FRHF, КППГнг(А)-FRHF
     * - ВВГнг(А)-LS, ВВГнг(А)-FRLS
     * Optionally followed by cross-section like "3х1,5" or "2х2х1".
     */
    private static final Pattern CABLE_BRAND_PATTERN = Pattern.compile(
            "([А-ЯЁA-Z]{2,}нг\\([А-ЯA-Zа-яa-z]+\\)-[A-ZА-ЯЁа-яёa-z]{2,}" +
            "(?:\\s+\\d+[хx]\\d+(?:[хx]\\d+)?(?:[.,]\\d+)?)?)");

    /**
     * Extracts a cable brand code embedded in the name text.
     * @return {@code [cleanedName, brand]} or {@code null} if no brand found
     */
    private String[] extractEmbeddedCableBrand(String name) {
        if (name == null) return null;
        Matcher m = CABLE_BRAND_PATTERN.matcher(name);
        if (m.find()) {
            String brandStr = m.group(1).trim();
            // Only extract if the brand is embedded WITHIN the name (not at the very start)
            // and the remaining name is still meaningful
            String before = name.substring(0, m.start()).trim();
            String after  = name.substring(m.end()).trim();
            // Remove trailing/leading commas, dashes from the clean name parts
            before = before.replaceAll("[,\\-\\s]+$", "").trim();
            after  = after.replaceAll("^[,\\-\\s]+", "").trim();
            String cleanName = (before + (after.isEmpty() ? "" : " " + after)).trim();
            // Only extract if both the brand and cleaned name are substantial
            if (brandStr.length() >= 5 && cleanName.length() >= 10) {
                return new String[]{cleanName, brandStr};
            }
        }
        return null;
    }

    // ─── CID garbage detection ──────────────────────────────────────────────

    /**
     * Pattern detecting CID-encoded font garbage in extracted text.
     * CID-garbled text typically appears as sequences of:
     * - ". N . . .N" (dots and single letters with spaces)
     * - Sequences of position-like references "1.1, 2.1, 3.1, 4.1"
     *   appearing 3+ times in a non-tabular context
     * - Single punctuation chars separated by spaces ". , . , ."
     */
    private static final Pattern CID_GARBAGE_PATTERN = Pattern.compile(
            "(\\. [A-ZА-Я] \\. |" +                     // ". N . " pattern
            "\\.\\s*N\\s*\\.\\s*\\.\\s*\\.N|" +          // ".N...N" pattern
            "(?:\\d\\.\\d,\\s*){3,}|" +                   // "1.1, 2.1, 3.1, " repeated
            "(?:\\. ){3,}|" +                              // ". . . " repeated dots
            "(?:, ){4,})"                                  // ", , , , " repeated commas
    );

    /**
     * Strips CID-encoded garbage text from a field value.
     * Truncates at the first garbage boundary, keeping the clean prefix.
     */
    private String stripCidGarbage(String raw) {
        if (raw == null || raw.isBlank()) return raw;
        Matcher m = CID_GARBAGE_PATTERN.matcher(raw);
        if (m.find()) {
            String before = raw.substring(0, m.start()).trim();
            // Clean trailing punctuation from the truncation point
            before = before.replaceAll("[\\-,;:\\s\\.]+$", "").trim();
            return before.isEmpty() ? null : before;
        }
        return raw;
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
        // Short non-unit text <=4 chars = stamp (single chars, abbreviations like "п.", "д 1")
        // BUT preserve multi-digit numbers (60, 180, 350, 1950) — these are often quantities
        // that end up on their own line when ColumnAwareStripper splits at column boundaries.
        if (lower.length() <= 4 && !UNITS.contains(lower) && !lower.trim().matches("\\d{2,}")) return true;
        if (lower.startsWith("разраб.") || lower.startsWith("пров.")
                || lower.startsWith("н.контр") || lower.startsWith("н. контр")
                || lower.startsWith("утв.") || lower.startsWith("гип ")
                || lower.startsWith("гл.спец") || lower.startsWith("нач. отд")
                || lower.startsWith("нач.отд")) return true;
        if (lower.startsWith("изм.") && lower.length() < 60) return true;
        if (lower.contains("кол.уч") || lower.contains("ьсипдоп") || lower.contains("ьсипдП")) return true;
        // Stamp footer: "Формат А3", "Лист X", "Листов Y"
        if (lower.startsWith("формат а") || (lower.startsWith("лист") && lower.length() < 20)) return true;
        if (lower.contains("стадия") && (lower.contains("лист") || lower.contains("листов"))) return true;
        if (line.matches("^[РрRr]\\s+\\d+.*")) return true;
        if (line.matches(".*[а-яёА-ЯЁ]\\.[а-яёА-ЯЁ].*") && line.trim().length() < 20) return true;
        if (line.trim().matches("\\d{2}\\.\\d{2}") || line.trim().matches("\\d{2}\\.\\d{2}\\s.*")) return true;
        // Revision/change table text: multiple dates (dd.mm.yy or dd.mm.yyyy)
        if (countDatePatterns(lower) >= 2) return true;
        // Project document codes like "1218-Д00100.2/25-Р-АОВ" repeated in stamp/revision tables
        if (PROJECT_CODE_PATTERN.matcher(line).find() && lower.length() < 100) return true;
        // Vertical text fragments from stamp column (single chars or fragments like "п.", "д 1", "о 0.")
        if (lower.matches("^[а-яёa-z]\\.?\\s*\\d*\\.?\\s*$") && lower.length() < 8) return true;
        // Lines with mostly dots and single chars (corrupted stamp text)
        long dotCount = lower.chars().filter(c -> c == '.').count();
        if (dotCount > 5 && lower.length() < 80) return true;
        // Stamp lines with date-like fragments (e.g. ".2 01.07.25", "6332-20.1")
        // These come from drawing stamp revision tables and title blocks.
        // Only match short lines that are predominantly stamp text (no Cyrillic words >= 4 chars).
        if (lower.matches(".*\\d{4}-\\d+\\.\\d+.*") && lower.length() < 40
                && !lower.matches(".*[а-яё]{4,}.*")) return true;
        // Lines containing partial project codes split across stamp columns (e.g. "1218- 00100.2/25-")
        // Must be short and not contain meaningful Cyrillic text.
        if (lower.matches(".*\\d{3,4}-\\s*\\d{4,}.*") && lower.length() < 50
                && !lower.matches(".*[а-яё]{4,}.*")) return true;
        // Stamp approval lines with date in format "dd.mm.yy" at start or end
        if (lower.matches("^\\.[0-9]\\s+\\d{2}\\.\\d{2}\\.\\d{2,4}.*")) return true;
        // Lines that are just a single date pattern (e.g. "01.07.25") — stamp date field
        if (lower.matches("^\\d{2}\\.\\d{2}\\.\\d{2,4}$")) return true;
        return false;
    }

    private int countDatePatterns(String text) {
        Matcher m = Pattern.compile("\\d{2}\\.\\d{2}\\.\\d{2,4}").matcher(text);
        int count = 0;
        while (m.find()) count++;
        return count;
    }

    private boolean isColumnHeader(String line) {
        String lower = line.toLowerCase();
        boolean hasPos  = lower.contains("позиция") || lower.contains("поз.");
        boolean hasName = lower.contains("наименование") || lower.contains("наимено")
                || lower.contains("техническая характеристика");
        boolean hasZav  = lower.contains("завод") || lower.contains("изготовитель") || lower.contains("ед. изм");
        boolean hasCode = lower.contains("код") || lower.contains("обозначение");
        if ((hasPos && hasName) || (hasPos && hasZav) || (hasName && hasZav && hasCode)) return true;

        // ИТП-style multi-line headers: continuation lines like:
        //   "опросного листа (возможно  Код продукции  (может быть выбран  изме  Масса"
        //   "ре  Кол.  1 ед.,  Примечание"
        //   "применение аналога)  на конкурсной основе)  ния  кг"
        // These contain column keywords but not the primary combos above.
        // Detect them when 2+ column keywords appear in a short line (< 120 chars).
        if (line.trim().length() < 120) {
            int kwCount = 0;
            if (lower.contains("примечание")) kwCount++;
            if (lower.contains("кол.") || lower.contains("кол-во") || lower.contains("количество")) kwCount++;
            if (lower.contains("масса") || lower.contains("вес")) kwCount++;
            if (hasCode) kwCount++;
            if (lower.contains("опросного листа")) kwCount++;
            if (lower.contains("конкурсной основе")) kwCount++;
            if (lower.contains("ед.") || lower.contains("единица")) kwCount++;
            if (lower.contains("поставщик")) kwCount++;
            if (kwCount >= 2) return true;
        }

        return false;
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
