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
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.util.UUID;

@Entity
@Table(name = "personal_cards", indexes = {
        @Index(name = "idx_personal_card_employee", columnList = "employee_id")
})
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PersonalCard extends BaseEntity {

    @Column(name = "employee_id", nullable = false, unique = true)
    private UUID employeeId;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "form_t2_data", nullable = false, columnDefinition = "jsonb")
    @Builder.Default
    private String formT2Data = "{}";
}
