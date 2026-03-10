package com.privod.platform.infrastructure.storage;

import lombok.extern.slf4j.Slf4j;
import org.apache.tika.Tika;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import java.io.IOException;
import java.util.Map;
import java.util.Set;

/**
 * Validates uploaded files: checks MIME type via content sniffing (Apache Tika)
 * and enforces a per-context whitelist.  Rejects executables and other dangerous
 * file types regardless of the client-supplied Content-Type header.
 */
@Service
@Slf4j
public class FileValidationService {

    private static final long MAX_FILE_SIZE_BYTES = 5L * 1024 * 1024 * 1024; // 5 GB

    /** Allowed MIME types per upload context. */
    private static final Map<String, Set<String>> CONTEXT_ALLOWED_TYPES = Map.of(
            "document", Set.of(
                    // Office documents
                    "application/pdf",
                    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
                    "application/msword",
                    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                    "application/vnd.ms-excel",
                    "application/vnd.openxmlformats-officedocument.presentationml.presentation",
                    "application/vnd.ms-powerpoint",
                    // Text
                    "text/plain",
                    "text/csv",
                    "text/xml",
                    "application/xml",
                    "application/json",
                    // Archives (проектная документация часто упакована в ZIP/RAR/7z)
                    "application/zip",
                    "application/x-zip-compressed",
                    "application/x-rar-compressed",
                    "application/vnd.rar",
                    "application/x-7z-compressed",
                    // AutoCAD DWG / IFC (BIM)
                    "image/x-dwg",
                    "image/vnd.dwg",
                    "application/acad",
                    "application/x-acad",
                    "application/octet-stream", // generic fallback — Tika не всегда распознаёт DWG/IFC
                    // Images
                    "image/jpeg",
                    "image/png",
                    "image/gif",
                    "image/webp",
                    "image/svg+xml",
                    "image/bmp",
                    "image/tiff"
            ),
            "csv", Set.of("text/plain", "text/csv", "application/csv"),
            "bim", Set.of("application/octet-stream"), // IFC files are detected as octet-stream
            "image", Set.of("image/jpeg", "image/png", "image/gif", "image/webp")
    );

    private static final Set<String> DEFAULT_ALLOWED_TYPES = CONTEXT_ALLOWED_TYPES.get("document");

    private final Tika tika = new Tika();

    /**
     * Validates file size and MIME type for the given context.
     *
     * @param file    the uploaded file
     * @param context upload context key (e.g. "document", "csv", "bim", "image")
     * @throws ResponseStatusException 400 if validation fails
     */
    public void validate(MultipartFile file, String context) {
        if (file == null || file.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Файл не может быть пустым");
        }

        if (file.getSize() > MAX_FILE_SIZE_BYTES) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Размер файла превышает допустимый предел 5 ГБ");
        }

        String detectedMime = detectMimeType(file);
        Set<String> allowed = CONTEXT_ALLOWED_TYPES.getOrDefault(context, DEFAULT_ALLOWED_TYPES);

        if (!allowed.contains(detectedMime)) {
            log.warn("Отклонена загрузка файла: тип {} не разрешён для контекста {}. " +
                            "Файл: {}, заявленный MIME: {}",
                    detectedMime, context,
                    file.getOriginalFilename(), file.getContentType());
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Недопустимый тип файла: " + detectedMime +
                            ". Разрешены: " + allowed);
        }

        log.debug("Файл прошёл валидацию: name={}, size={}, mime={}, context={}",
                file.getOriginalFilename(), file.getSize(), detectedMime, context);
    }

    /**
     * Convenience overload for the default "document" context.
     */
    public void validate(MultipartFile file) {
        validate(file, "document");
    }

    private String detectMimeType(MultipartFile file) {
        try {
            // Tika sniffs first 8 KB of the stream — does not require full file read
            return tika.detect(file.getInputStream(), file.getOriginalFilename());
        } catch (IOException e) {
            log.warn("Не удалось определить MIME-тип файла {}: {}", file.getOriginalFilename(), e.getMessage());
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Не удалось прочитать содержимое файла");
        }
    }
}
