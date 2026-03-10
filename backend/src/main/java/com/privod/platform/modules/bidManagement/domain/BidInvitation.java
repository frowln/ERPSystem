package com.privod.platform.modules.bidManagement.domain;

import com.privod.platform.infrastructure.persistence.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Index;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "bid_invitations", indexes = {
        @Index(name = "idx_bid_inv_pkg", columnList = "bid_package_id")
})
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BidInvitation extends BaseEntity {

    @Column(name = "bid_package_id", nullable = false)
    private UUID bidPackageId;

    @Column(name = "vendor_id")
    private UUID vendorId;

    @Column(name = "vendor_name", nullable = false, length = 255)
    private String vendorName;

    @Column(name = "vendor_email", length = 255)
    private String vendorEmail;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 30)
    @Builder.Default
    private BidInvitationStatus status = BidInvitationStatus.INVITED;

    @Column(name = "invited_at")
    @Builder.Default
    private LocalDateTime invitedAt = LocalDateTime.now();

    @Column(name = "responded_at")
    private LocalDateTime respondedAt;

    @Column(name = "bid_amount", precision = 18, scale = 2)
    private BigDecimal bidAmount;

    @Column(name = "bid_notes", columnDefinition = "TEXT")
    private String bidNotes;

    @Column(name = "attachments_count")
    @Builder.Default
    private Integer attachmentsCount = 0;
}
