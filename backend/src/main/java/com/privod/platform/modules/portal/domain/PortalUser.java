package com.privod.platform.modules.portal.domain;

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

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "portal_users", indexes = {
        @Index(name = "idx_portal_user_email", columnList = "email"),
        @Index(name = "idx_portal_user_org", columnList = "organization_id"),
        @Index(name = "idx_portal_user_status", columnList = "status"),
        @Index(name = "idx_portal_user_role", columnList = "portal_role")
})
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PortalUser extends BaseEntity {

    @Column(name = "email", nullable = false, unique = true, length = 255)
    private String email;

    @Column(name = "password_hash", nullable = false, length = 255)
    private String passwordHash;

    @Column(name = "first_name", nullable = false, length = 100)
    private String firstName;

    @Column(name = "last_name", nullable = false, length = 100)
    private String lastName;

    @Column(name = "phone", length = 50)
    private String phone;

    @Column(name = "organization_id")
    private UUID organizationId;

    @Column(name = "organization_name", length = 500)
    private String organizationName;

    @Column(name = "inn", length = 12)
    private String inn;

    @Enumerated(EnumType.STRING)
    @Column(name = "portal_role", nullable = false, length = 30)
    private PortalRole portalRole;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    @Builder.Default
    private PortalUserStatus status = PortalUserStatus.PENDING;

    @Column(name = "last_login_at")
    private Instant lastLoginAt;

    @Column(name = "invited_by_id")
    private UUID invitedById;

    public String getFullName() {
        return lastName + " " + firstName;
    }
}
