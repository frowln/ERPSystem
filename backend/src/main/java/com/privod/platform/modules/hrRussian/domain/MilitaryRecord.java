package com.privod.platform.modules.hrRussian.domain;

import com.privod.platform.infrastructure.persistence.BaseEntity;
import com.privod.platform.infrastructure.security.EncryptedFieldConverter;
import jakarta.persistence.Column;
import jakarta.persistence.Convert;
import jakarta.persistence.Entity;
import jakarta.persistence.Index;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.Filter;

import java.util.UUID;

@Entity
@Table(name = "military_records", indexes = {
        @Index(name = "idx_military_employee", columnList = "employee_id")
})
@Filter(name = "tenantFilter", condition = "organization_id = :organizationId")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MilitaryRecord extends BaseEntity {

    @Column(name = "organization_id")
    private UUID organizationId;

    @Column(name = "employee_id", nullable = false, unique = true)
    private UUID employeeId;

    // Special category personal data (152-ФЗ ст.10) — encrypted at rest with AES-256-GCM
    @Convert(converter = EncryptedFieldConverter.class)
    @Column(name = "category", columnDefinition = "TEXT")
    private String category;

    @Convert(converter = EncryptedFieldConverter.class)
    @Column(name = "rank", columnDefinition = "TEXT")
    private String rank;

    @Convert(converter = EncryptedFieldConverter.class)
    @Column(name = "specialty", columnDefinition = "TEXT")
    private String specialty;

    @Convert(converter = EncryptedFieldConverter.class)
    @Column(name = "fitness_category", columnDefinition = "TEXT")
    private String fitnessCategory;

    @Column(name = "registration_office", length = 300)
    private String registrationOffice;

    @Column(name = "is_registered", nullable = false)
    @Builder.Default
    private boolean registered = false;
}
