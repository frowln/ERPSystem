package com.privod.platform.modules.document.domain;

import com.privod.platform.infrastructure.persistence.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Index;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.UUID;

@Entity
@Table(name = "document_access", indexes = {
        @Index(name = "idx_doc_access_document", columnList = "document_id"),
        @Index(name = "idx_doc_access_user", columnList = "user_id")
}, uniqueConstraints = {
        @UniqueConstraint(name = "uq_document_access_user", columnNames = {"document_id", "user_id"})
})
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DocumentAccess extends BaseEntity {

    @Column(name = "document_id", nullable = false)
    private UUID documentId;

    @Column(name = "user_id", nullable = false)
    private UUID userId;

    @Enumerated(EnumType.STRING)
    @Column(name = "access_level", nullable = false, length = 20)
    private AccessLevel accessLevel;

    @Column(name = "granted_by_id")
    private UUID grantedById;

    @Column(name = "granted_by_name", length = 255)
    private String grantedByName;
}
