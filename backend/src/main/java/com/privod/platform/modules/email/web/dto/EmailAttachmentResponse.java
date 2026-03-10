package com.privod.platform.modules.email.web.dto;

import com.privod.platform.modules.email.domain.EmailAttachment;

import java.util.UUID;

public record EmailAttachmentResponse(
        UUID id,
        String fileName,
        String contentType,
        Long sizeBytes
) {
    public static EmailAttachmentResponse fromEntity(EmailAttachment att) {
        return new EmailAttachmentResponse(
                att.getId(),
                att.getFileName(),
                att.getContentType(),
                att.getSizeBytes()
        );
    }
}
