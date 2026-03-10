package com.privod.platform.modules.email.domain;

import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "email_messages", indexes = {
        @Index(name = "idx_email_messages_folder", columnList = "folder"),
        @Index(name = "idx_email_messages_received", columnList = "received_at"),
        @Index(name = "idx_email_messages_from", columnList = "from_address"),
        @Index(name = "idx_email_messages_read", columnList = "is_read")
}, uniqueConstraints = {
        @UniqueConstraint(columnNames = {"message_uid", "folder"})
})
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class EmailMessage {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id", updatable = false, nullable = false)
    private UUID id;

    @Column(name = "message_uid", nullable = false, length = 500)
    private String messageUid;

    @Column(name = "message_id_header", length = 1000)
    private String messageIdHeader;

    @Column(name = "folder", nullable = false, length = 100)
    @Builder.Default
    private String folder = "INBOX";

    @Column(name = "from_address", nullable = false, length = 500)
    private String fromAddress;

    @Column(name = "from_name", length = 500)
    private String fromName;

    @Column(name = "to_addresses", columnDefinition = "TEXT")
    private String toAddresses;

    @Column(name = "cc_addresses", columnDefinition = "TEXT")
    private String ccAddresses;

    @Column(name = "bcc_addresses", columnDefinition = "TEXT")
    private String bccAddresses;

    @Column(name = "subject", length = 2000)
    private String subject;

    @Column(name = "body_text", columnDefinition = "TEXT")
    private String bodyText;

    @Column(name = "body_html", columnDefinition = "TEXT")
    private String bodyHtml;

    @Column(name = "received_at", nullable = false)
    private Instant receivedAt;

    @Column(name = "is_read")
    @Builder.Default
    private boolean isRead = false;

    @Column(name = "is_starred")
    @Builder.Default
    private boolean isStarred = false;

    @Column(name = "is_draft")
    @Builder.Default
    private boolean isDraft = false;

    @Column(name = "has_attachments")
    @Builder.Default
    private boolean hasAttachments = false;

    @Column(name = "in_reply_to", length = 1000)
    private String inReplyTo;

    @Column(name = "references_header", columnDefinition = "TEXT")
    private String referencesHeader;

    @Column(name = "raw_headers", columnDefinition = "TEXT")
    private String rawHeaders;

    @Column(name = "created_at", updatable = false)
    @Builder.Default
    private Instant createdAt = Instant.now();

    @Column(name = "updated_at")
    @Builder.Default
    private Instant updatedAt = Instant.now();

    @OneToMany(mappedBy = "emailMessage", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<EmailAttachment> attachments = new ArrayList<>();

    @OneToMany(mappedBy = "emailMessage", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<EmailProjectLink> projectLinks = new ArrayList<>();

    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = Instant.now();
    }
}
