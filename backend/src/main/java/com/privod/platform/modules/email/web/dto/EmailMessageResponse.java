package com.privod.platform.modules.email.web.dto;

import com.privod.platform.modules.email.domain.EmailMessage;
import com.privod.platform.modules.email.domain.EmailProjectLink;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

public record EmailMessageResponse(
        UUID id,
        String messageUid,
        String folder,
        String fromAddress,
        String fromName,
        List<String> toAddresses,
        List<String> ccAddresses,
        String subject,
        String bodyText,
        String bodyHtml,
        Instant receivedAt,
        boolean isRead,
        boolean isStarred,
        boolean hasAttachments,
        List<EmailAttachmentResponse> attachments,
        List<UUID> linkedProjectIds,
        Instant createdAt
) {
    public static EmailMessageResponse fromEntity(EmailMessage msg) {
        return new EmailMessageResponse(
                msg.getId(),
                msg.getMessageUid(),
                msg.getFolder(),
                msg.getFromAddress(),
                msg.getFromName(),
                parseJsonArray(msg.getToAddresses()),
                parseJsonArray(msg.getCcAddresses()),
                msg.getSubject(),
                msg.getBodyText(),
                msg.getBodyHtml(),
                msg.getReceivedAt(),
                msg.isRead(),
                msg.isStarred(),
                msg.isHasAttachments(),
                msg.getAttachments() != null
                        ? msg.getAttachments().stream().map(EmailAttachmentResponse::fromEntity).toList()
                        : List.of(),
                msg.getProjectLinks() != null
                        ? msg.getProjectLinks().stream().map(EmailProjectLink::getProjectId).toList()
                        : List.of(),
                msg.getCreatedAt()
        );
    }

    public static EmailMessageResponse listView(EmailMessage msg) {
        return new EmailMessageResponse(
                msg.getId(),
                msg.getMessageUid(),
                msg.getFolder(),
                msg.getFromAddress(),
                msg.getFromName(),
                parseJsonArray(msg.getToAddresses()),
                null,
                msg.getSubject(),
                null,
                null,
                msg.getReceivedAt(),
                msg.isRead(),
                msg.isStarred(),
                msg.isHasAttachments(),
                null,
                null,
                msg.getCreatedAt()
        );
    }

    private static List<String> parseJsonArray(String json) {
        if (json == null || json.isBlank()) return List.of();
        String cleaned = json.replaceAll("[\\[\\]\"]", "");
        if (cleaned.isBlank()) return List.of();
        return List.of(cleaned.split(",")).stream().map(String::trim).filter(s -> !s.isEmpty()).toList();
    }
}
