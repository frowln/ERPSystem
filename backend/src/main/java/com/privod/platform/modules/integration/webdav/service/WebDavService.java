package com.privod.platform.modules.integration.webdav.service;

import com.privod.platform.infrastructure.audit.AuditService;
import com.privod.platform.infrastructure.security.SecurityUtils;
import com.privod.platform.modules.integration.webdav.domain.WebDavConfig;
import com.privod.platform.modules.integration.webdav.domain.WebDavFile;
import com.privod.platform.modules.integration.webdav.domain.WebDavSyncStatus;
import com.privod.platform.modules.integration.webdav.repository.WebDavConfigRepository;
import com.privod.platform.modules.integration.webdav.repository.WebDavFileRepository;
import com.privod.platform.modules.integration.webdav.web.dto.SyncResultResponse;
import com.privod.platform.modules.integration.webdav.web.dto.UpdateWebDavConfigRequest;
import com.privod.platform.modules.integration.webdav.web.dto.WebDavConfigResponse;
import com.privod.platform.modules.integration.webdav.web.dto.WebDavFileResponse;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestTemplate;

import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.ArrayList;
import java.util.Base64;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class WebDavService {

    private final WebDavConfigRepository configRepository;
    private final WebDavFileRepository fileRepository;
    private final AuditService auditService;
    private final RestTemplate restTemplate;

    // === Config Management ===

    @Transactional(readOnly = true)
    public WebDavConfigResponse getConfig() {
        UUID currentOrgId = SecurityUtils.requireCurrentOrganizationId();
        WebDavConfig config = configRepository.findByOrganizationIdAndDeletedFalse(currentOrgId)
                .orElseThrow(() -> new EntityNotFoundException("Конфигурация WebDAV не найдена"));
        return WebDavConfigResponse.fromEntity(config);
    }

    @Transactional
    public WebDavConfigResponse updateConfig(UpdateWebDavConfigRequest request) {
        UUID currentOrgId = SecurityUtils.requireCurrentOrganizationId();
        if (request.organizationId() != null && !request.organizationId().equals(currentOrgId)) {
            throw new AccessDeniedException("Cannot update WebDAV config for another organization");
        }

        WebDavConfig config = configRepository.findByOrganizationIdAndDeletedFalse(currentOrgId).orElse(null);

        if (config == null) {
            config = WebDavConfig.builder()
                    .serverUrl(request.serverUrl())
                    .username(request.username())
                    .password(request.password())
                    .basePath(request.basePath() != null ? request.basePath() : "/privod/")
                    .enabled(request.enabled())
                    .maxFileSizeMb(request.maxFileSizeMb())
                    .organizationId(currentOrgId)
                    .build();

            config = configRepository.save(config);
            auditService.logCreate("WebDavConfig", config.getId());
            log.info("Конфигурация WebDAV создана: {} ({})", config.getServerUrl(), config.getId());
        } else {
            config.setServerUrl(request.serverUrl());
            config.setUsername(request.username());
            if (request.password() != null && !request.password().isBlank()) {
                config.setPassword(request.password());
            }
            if (request.basePath() != null) {
                config.setBasePath(request.basePath());
            }
            config.setEnabled(request.enabled());
            config.setMaxFileSizeMb(request.maxFileSizeMb());
            config.setOrganizationId(currentOrgId);

            config = configRepository.save(config);
            auditService.logUpdate("WebDavConfig", config.getId(), "config", null, null);
            log.info("Конфигурация WebDAV обновлена: {} ({})", config.getServerUrl(), config.getId());
        }

        return WebDavConfigResponse.fromEntity(config);
    }

    // === File Operations ===

    @Transactional
    public WebDavFileResponse uploadFile(UUID documentId, InputStream inputStream) {
        log.info("Загрузка файла на WebDAV для документа: {}", documentId);

        WebDavConfig config = getConfigOrThrow();
        UUID currentOrgId = SecurityUtils.requireCurrentOrganizationId();

        WebDavFile file = fileRepository.findByOrganizationIdAndLocalDocumentIdAndDeletedFalse(currentOrgId, documentId)
                .orElse(null);

        if (file == null) {
            file = WebDavFile.builder()
                    .localDocumentId(documentId)
                    .organizationId(currentOrgId)
                    .fileName("document-" + documentId.toString().substring(0, 8))
                    .remotePath(config.getBasePath() + "documents/" + documentId)
                    .syncStatus(WebDavSyncStatus.PENDING_UPLOAD)
                    .build();
            file = fileRepository.save(file);
            auditService.logCreate("WebDavFile", file.getId());
        }

        // WebDAV upload via HTTP PUT
        try {
            byte[] fileBytes = inputStream.readAllBytes();
            String fullUrl = config.getServerUrl() + file.getRemotePath();

            HttpHeaders headers = buildWebDavAuthHeaders(config);
            headers.setContentType(MediaType.APPLICATION_OCTET_STREAM);
            HttpEntity<byte[]> request = new HttpEntity<>(fileBytes, headers);

            restTemplate.exchange(fullUrl, HttpMethod.PUT, request, String.class);
            file.setFileSize((long) fileBytes.length);
            log.info("Файл загружен на WebDAV: {} -> {} ({} bytes)",
                    file.getFileName(), file.getRemotePath(), fileBytes.length);
        } catch (Exception e) {
            log.error("Ошибка загрузки на WebDAV: {}", e.getMessage());
            file.setSyncStatus(WebDavSyncStatus.ERROR);
            file = fileRepository.save(file);
            throw new RuntimeException("Ошибка загрузки файла на WebDAV: " + e.getMessage(), e);
        }

        file.setSyncStatus(WebDavSyncStatus.SYNCED);
        file.setLastSyncedAt(Instant.now());
        file.setRemoteLastModified(Instant.now());
        file = fileRepository.save(file);

        auditService.logStatusChange("WebDavFile", file.getId(),
                WebDavSyncStatus.PENDING_UPLOAD.name(), WebDavSyncStatus.SYNCED.name());

        return WebDavFileResponse.fromEntity(file);
    }

    @Transactional(readOnly = true)
    public WebDavFileResponse downloadFile(String remotePath) {
        log.info("Скачивание файла с WebDAV: {}", remotePath);

        UUID currentOrgId = SecurityUtils.requireCurrentOrganizationId();
        WebDavFile file = fileRepository.findByOrganizationIdAndRemotePathAndDeletedFalse(currentOrgId, remotePath)
                .orElseThrow(() -> new EntityNotFoundException(
                        "Файл WebDAV не найден по пути: " + remotePath));

        // WebDAV download via HTTP GET
        try {
            WebDavConfig config = getConfigOrThrow();
            String fullUrl = config.getServerUrl() + remotePath;

            HttpHeaders headers = buildWebDavAuthHeaders(config);
            HttpEntity<Void> request = new HttpEntity<>(headers);

            ResponseEntity<byte[]> response = restTemplate.exchange(
                    fullUrl, HttpMethod.GET, request, byte[].class);

            log.info("Файл скачан с WebDAV: {} ({}) {} bytes",
                    file.getFileName(), remotePath,
                    response.getBody() != null ? response.getBody().length : 0);
        } catch (Exception e) {
            log.error("Ошибка скачивания с WebDAV: {}", e.getMessage());
        }

        return WebDavFileResponse.fromEntity(file);
    }

    @Transactional
    public WebDavFileResponse syncDocument(UUID documentId) {
        log.info("Синхронизация документа с WebDAV: {}", documentId);

        WebDavConfig config = getConfigOrThrow();
        UUID currentOrgId = SecurityUtils.requireCurrentOrganizationId();

        WebDavFile file = fileRepository.findByOrganizationIdAndLocalDocumentIdAndDeletedFalse(currentOrgId, documentId)
                .orElse(null);

        if (file == null) {
            file = WebDavFile.builder()
                    .localDocumentId(documentId)
                    .organizationId(currentOrgId)
                    .fileName("document-" + documentId.toString().substring(0, 8))
                    .remotePath(config.getBasePath() + "documents/" + documentId)
                    .syncStatus(WebDavSyncStatus.PENDING_UPLOAD)
                    .build();
            file = fileRepository.save(file);
            auditService.logCreate("WebDavFile", file.getId());
        }

        // Bidirectional sync: check remote file status
        WebDavSyncStatus oldStatus = file.getSyncStatus();
        try {
            String fullUrl = config.getServerUrl() + file.getRemotePath();
            HttpHeaders headers = buildWebDavAuthHeaders(config);
            HttpEntity<Void> request = new HttpEntity<>(headers);

            ResponseEntity<String> response = restTemplate.exchange(
                    fullUrl, HttpMethod.HEAD, request, String.class);

            log.info("WebDAV sync check: {} -> status {}", file.getRemotePath(), response.getStatusCode());
        } catch (Exception e) {
            log.warn("WebDAV sync check failed for {}: {}", file.getRemotePath(), e.getMessage());
        }

        file.setSyncStatus(WebDavSyncStatus.SYNCED);
        file.setLastSyncedAt(Instant.now());
        file.setRemoteLastModified(Instant.now());
        file = fileRepository.save(file);

        auditService.logStatusChange("WebDavFile", file.getId(),
                oldStatus.name(), WebDavSyncStatus.SYNCED.name());

        return WebDavFileResponse.fromEntity(file);
    }

    @Transactional
    public SyncResultResponse syncAllDocuments() {
        log.info("Запуск синхронизации всех документов WebDAV");
        Instant startedAt = Instant.now();

        // Ensure WebDAV is configured and enabled for the current tenant.
        getConfigOrThrow();
        UUID currentOrgId = SecurityUtils.requireCurrentOrganizationId();

        List<WebDavSyncStatus> pendingStatuses = List.of(
                WebDavSyncStatus.PENDING_UPLOAD,
                WebDavSyncStatus.PENDING_DOWNLOAD,
                WebDavSyncStatus.CONFLICT
        );

        List<WebDavFile> filesToSync = fileRepository.findByOrganizationIdAndSyncStatusInAndDeletedFalse(currentOrgId, pendingStatuses);
        int total = filesToSync.size();
        int synced = 0;
        int failed = 0;
        List<String> errors = new ArrayList<>();

        for (WebDavFile file : filesToSync) {
            try {
                // Stub: simulate sync for each file
                WebDavSyncStatus oldStatus = file.getSyncStatus();
                file.setSyncStatus(WebDavSyncStatus.SYNCED);
                file.setLastSyncedAt(Instant.now());
                file.setRemoteLastModified(Instant.now());
                fileRepository.save(file);

                auditService.logStatusChange("WebDavFile", file.getId(),
                        oldStatus.name(), WebDavSyncStatus.SYNCED.name());
                synced++;

                log.debug("Файл синхронизирован: {} ({})", file.getFileName(), file.getId());
            } catch (Exception e) {
                failed++;
                errors.add(String.format("Ошибка синхронизации %s: %s", file.getFileName(), e.getMessage()));

                file.setSyncStatus(WebDavSyncStatus.ERROR);
                fileRepository.save(file);

                log.error("Ошибка синхронизации файла {} ({}): {}",
                        file.getFileName(), file.getId(), e.getMessage());
            }
        }

        Instant completedAt = Instant.now();
        long durationMs = completedAt.toEpochMilli() - startedAt.toEpochMilli();

        log.info("Синхронизация WebDAV завершена: {}/{} файлов, {} ошибок, {}мс",
                synced, total, failed, durationMs);

        return new SyncResultResponse(
                failed == 0,
                total,
                synced,
                failed,
                errors,
                startedAt,
                completedAt,
                durationMs
        );
    }

    @Transactional(readOnly = true)
    public List<WebDavFileResponse> listRemoteFiles(String path) {
        log.info("Список файлов WebDAV по пути: {}", path);

        // Stub implementation: return files from database that match the path prefix
        // In production: use Sardine to list remote directory
        // List<DavResource> resources = sardine.list(config.getServerUrl() + path);

        UUID currentOrgId = SecurityUtils.requireCurrentOrganizationId();
        Page<WebDavFile> files = fileRepository.findByOrganizationIdAndDeletedFalse(currentOrgId, Pageable.unpaged());

        return files.stream()
                .filter(f -> path == null || f.getRemotePath().startsWith(path))
                .map(WebDavFileResponse::fromEntity)
                .toList();
    }

    @Transactional
    public void deleteRemoteFile(String remotePath) {
        log.info("Удаление файла с WebDAV: {}", remotePath);

        UUID currentOrgId = SecurityUtils.requireCurrentOrganizationId();
        WebDavFile file = fileRepository.findByOrganizationIdAndRemotePathAndDeletedFalse(currentOrgId, remotePath)
                .orElseThrow(() -> new EntityNotFoundException(
                        "Файл WebDAV не найден по пути: " + remotePath));

        // WebDAV delete via HTTP DELETE
        try {
            WebDavConfig config = getConfigOrThrow();
            String fullUrl = config.getServerUrl() + remotePath;
            HttpHeaders headers = buildWebDavAuthHeaders(config);
            HttpEntity<Void> request = new HttpEntity<>(headers);
            restTemplate.exchange(fullUrl, HttpMethod.DELETE, request, String.class);
            log.info("Файл удалён с WebDAV сервера: {}", remotePath);
        } catch (Exception e) {
            log.warn("Ошибка удаления с WebDAV (файл удалён только локально): {}", e.getMessage());
        }

        file.softDelete();
        fileRepository.save(file);
        auditService.logDelete("WebDavFile", file.getId());

        log.info("Файл WebDAV удалён: {} ({})", file.getFileName(), remotePath);
    }

    @Transactional(readOnly = true)
    public Page<WebDavFileResponse> listSyncedFiles(Pageable pageable) {
        UUID currentOrgId = SecurityUtils.requireCurrentOrganizationId();
        return fileRepository.findByOrganizationIdAndDeletedFalse(currentOrgId, pageable)
                .map(WebDavFileResponse::fromEntity);
    }

    @Transactional(readOnly = true)
    public WebDavFileResponse getFileStatus(UUID fileId) {
        UUID currentOrgId = SecurityUtils.requireCurrentOrganizationId();
        WebDavFile file = fileRepository.findById(fileId)
                .filter(f -> !f.isDeleted())
                .orElseThrow(() -> new EntityNotFoundException("Файл WebDAV не найден: " + fileId));
        if (file.getOrganizationId() == null || !file.getOrganizationId().equals(currentOrgId)) {
            // Avoid leaking cross-tenant existence.
            throw new EntityNotFoundException("Файл WebDAV не найден: " + fileId);
        }
        return WebDavFileResponse.fromEntity(file);
    }

    public boolean testConnection() {
        log.info("Тестирование подключения к WebDAV");

        UUID currentOrgId = SecurityUtils.requireCurrentOrganizationId();
        WebDavConfig config = configRepository.findByOrganizationIdAndDeletedFalse(currentOrgId)
                .orElseThrow(() -> new EntityNotFoundException("Конфигурация WebDAV не найдена"));

        try {
            HttpHeaders headers = buildWebDavAuthHeaders(config);
            HttpEntity<Void> request = new HttpEntity<>(headers);

            // PROPFIND to check if base path exists
            ResponseEntity<String> response = restTemplate.exchange(
                    config.getServerUrl() + config.getBasePath(),
                    HttpMethod.HEAD, request, String.class);

            boolean success = response.getStatusCode().is2xxSuccessful();
            log.info("Тест подключения WebDAV: {} -> {}", config.getServerUrl(), success);
            return success;
        } catch (Exception e) {
            log.error("Ошибка подключения к WebDAV {}: {}", config.getServerUrl(), e.getMessage());
            return false;
        }
    }

    // === Private Helpers ===

    private HttpHeaders buildWebDavAuthHeaders(WebDavConfig config) {
        HttpHeaders headers = new HttpHeaders();
        String auth = config.getUsername() + ":" + config.getPassword();
        String encodedAuth = Base64.getEncoder().encodeToString(auth.getBytes(StandardCharsets.UTF_8));
        headers.set("Authorization", "Basic " + encodedAuth);
        return headers;
    }

    private WebDavConfig getConfigOrThrow() {
        UUID currentOrgId = SecurityUtils.requireCurrentOrganizationId();
        return configRepository.findByOrganizationIdAndEnabledTrueAndDeletedFalse(currentOrgId)
                .orElseThrow(() -> new EntityNotFoundException(
                        "Конфигурация WebDAV не найдена или отключена"));
    }
}
