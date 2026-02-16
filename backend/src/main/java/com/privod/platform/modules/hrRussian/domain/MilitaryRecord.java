package com.privod.platform.modules.hrRussian.domain;

import com.privod.platform.infrastructure.persistence.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Index;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.UUID;

@Entity
@Table(name = "military_records", indexes = {
        @Index(name = "idx_military_employee", columnList = "employee_id")
})
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MilitaryRecord extends BaseEntity {

    @Column(name = "employee_id", nullable = false, unique = true)
    private UUID employeeId;

    @Column(name = "category", length = 50)
    private String category;

    @Column(name = "rank", length = 100)
    private String rank;

    @Column(name = "specialty", length = 200)
    private String specialty;

    @Column(name = "fitness_category", length = 10)
    private String fitnessCategory;

    @Column(name = "registration_office", length = 300)
    private String registrationOffice;

    @Column(name = "is_registered", nullable = false)
    @Builder.Default
    private boolean registered = false;
}
