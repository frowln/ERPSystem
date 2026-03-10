package com.privod.platform.modules.email.web;

import com.privod.platform.infrastructure.web.ApiResponse;
import com.privod.platform.infrastructure.web.PageResponse;
import com.privod.platform.modules.email.service.EmailComposeService;
import com.privod.platform.modules.email.service.EmailMailboxService;
import com.privod.platform.modules.email.service.EmailSyncService;
import com.privod.platform.modules.email.web.dto.*;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.FileSystemResource;
import org.springframework.core.io.Resource;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.io.File;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/email")
@RequiredArgsConstructor
@Tag(name = "Email", description = "Email integration (Yandex IMAP/SMTP)")
public class EmailController {

    private final EmailMailboxService mailboxService;
    private final EmailComposeService composeService;
    private final EmailSyncService emailSyncService;

    @GetMapping("/messages")
    @Operation(summary = "List email messages by folder")
    public ResponseEntity<ApiResponse<PageResponse<EmailMessageResponse>>> listMessages(
            @RequestParam(defaultValue = "INBOX") String folder,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) String search) {
        var pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "receivedAt"));
        var result = mailboxService.listMessages(folder, search, pageable);
        return ResponseEntity.ok(ApiResponse.ok(PageResponse.of(result)));
    }

    @GetMapping("/messages/{id}")
    @Operation(summary = "Get single email message with full body")
    public ResponseEntity<ApiResponse<EmailMessageResponse>> getMessage(@PathVariable UUID id) {
        mailboxService.markRead(id);
        return ResponseEntity.ok(ApiResponse.ok(mailboxService.getMessage(id)));
    }

    @PostMapping("/messages/{id}/read")
    @Operation(summary = "Mark message as read")
    public ResponseEntity<ApiResponse<Void>> markRead(@PathVariable UUID id) {
        mailboxService.markRead(id);
        return ResponseEntity.ok(ApiResponse.ok());
    }

    @PostMapping("/messages/{id}/unread")
    @Operation(summary = "Mark message as unread")
    public ResponseEntity<ApiResponse<Void>> markUnread(@PathVariable UUID id) {
        mailboxService.markUnread(id);
        return ResponseEntity.ok(ApiResponse.ok());
    }

    @PostMapping("/messages/{id}/star")
    @Operation(summary = "Star a message")
    public ResponseEntity<ApiResponse<Void>> star(@PathVariable UUID id) {
        mailboxService.star(id);
        return ResponseEntity.ok(ApiResponse.ok());
    }

    @PostMapping("/messages/{id}/unstar")
    @Operation(summary = "Unstar a message")
    public ResponseEntity<ApiResponse<Void>> unstar(@PathVariable UUID id) {
        mailboxService.unstar(id);
        return ResponseEntity.ok(ApiResponse.ok());
    }

    @DeleteMapping("/messages/{id}")
    @Operation(summary = "Move message to trash")
    public ResponseEntity<ApiResponse<Void>> deleteMessage(@PathVariable UUID id) {
        mailboxService.deleteMessage(id);
        return ResponseEntity.ok(ApiResponse.ok());
    }

    @PostMapping("/send")
    @Operation(summary = "Send a new email")
    public ResponseEntity<ApiResponse<EmailMessageResponse>> sendEmail(
            @Valid @RequestBody SendEmailRequest request) {
        var sent = composeService.sendEmail(request.to(), request.cc(), request.subject(), request.bodyHtml());
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok(EmailMessageResponse.fromEntity(sent)));
    }

    @PostMapping("/reply/{id}")
    @Operation(summary = "Reply to an email")
    public ResponseEntity<ApiResponse<EmailMessageResponse>> replyEmail(
            @PathVariable UUID id,
            @Valid @RequestBody ReplyEmailRequest request) {
        var sent = composeService.replyToEmail(id, request.bodyHtml(), request.replyAll());
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok(EmailMessageResponse.fromEntity(sent)));
    }

    @PostMapping("/forward/{id}")
    @Operation(summary = "Forward an email")
    public ResponseEntity<ApiResponse<EmailMessageResponse>> forwardEmail(
            @PathVariable UUID id,
            @Valid @RequestBody ForwardEmailRequest request) {
        var sent = composeService.forwardEmail(id, request.to(), request.cc(), request.bodyHtml());
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok(EmailMessageResponse.fromEntity(sent)));
    }

    @GetMapping("/messages/{emailId}/attachments/{attId}/download")
    @Operation(summary = "Download email attachment")
    public ResponseEntity<Resource> downloadAttachment(
            @PathVariable UUID emailId, @PathVariable UUID attId) {
        String path = mailboxService.getAttachmentPath(emailId, attId);
        File file = new File(path);
        if (!file.exists()) {
            return ResponseEntity.notFound().build();
        }
        Resource resource = new FileSystemResource(file);
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + file.getName() + "\"")
                .contentType(MediaType.APPLICATION_OCTET_STREAM)
                .body(resource);
    }

    @PostMapping("/messages/{id}/link-project")
    @Operation(summary = "Link email to a project")
    public ResponseEntity<ApiResponse<Void>> linkProject(
            @PathVariable UUID id,
            @Valid @RequestBody LinkProjectRequest request) {
        mailboxService.linkProject(id, request.projectId());
        return ResponseEntity.ok(ApiResponse.ok());
    }

    @DeleteMapping("/messages/{id}/unlink-project/{projectId}")
    @Operation(summary = "Unlink email from a project")
    public ResponseEntity<ApiResponse<Void>> unlinkProject(
            @PathVariable UUID id, @PathVariable UUID projectId) {
        mailboxService.unlinkProject(id, projectId);
        return ResponseEntity.ok(ApiResponse.ok());
    }

    @GetMapping("/projects/{projectId}/messages")
    @Operation(summary = "Get emails linked to a project")
    public ResponseEntity<ApiResponse<List<EmailMessageResponse>>> getProjectMessages(
            @PathVariable UUID projectId) {
        return ResponseEntity.ok(ApiResponse.ok(mailboxService.getProjectMessages(projectId)));
    }

    @GetMapping("/unread-count")
    @Operation(summary = "Get unread email count")
    public ResponseEntity<ApiResponse<Map<String, Long>>> getUnreadCount() {
        long count = mailboxService.getUnreadCount();
        return ResponseEntity.ok(ApiResponse.ok(Map.of("count", count)));
    }

    @PostMapping("/sync")
    @Operation(summary = "Trigger manual email sync (async)")
    public ResponseEntity<ApiResponse<Map<String, String>>> syncNow() {
        Thread.ofVirtual().start(emailSyncService::syncAllFolders);
        return ResponseEntity.ok(ApiResponse.ok(Map.of("status", "started")));
    }

    @PostMapping("/sync-full")
    @Operation(summary = "Trigger full email sync of ALL messages (async, may take a long time)")
    public ResponseEntity<ApiResponse<Map<String, String>>> syncFull() {
        Thread.ofVirtual().start(emailSyncService::syncAllFoldersFull);
        return ResponseEntity.ok(ApiResponse.ok(Map.of("status", "full_sync_started")));
    }
}
