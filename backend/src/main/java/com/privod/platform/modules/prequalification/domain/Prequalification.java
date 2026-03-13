package com.privod.platform.modules.prequalification.domain;

import com.privod.platform.infrastructure.persistence.BaseEntity;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.Filter;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

@Entity(name = "ContractorPrequalification")
@Table(name = "contractor_prequalifications")
@Filter(name = "tenantFilter", condition = "organization_id = :organizationId")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Prequalification extends BaseEntity {

    @Column(name = "organization_id", nullable = false)
    private UUID organizationId;

    @Column(name = "counterparty_id")
    private UUID counterpartyId;

    @Column(name = "company_name", nullable = false, length = 300)
    private String companyName;

    @Column(name = "inn", length = 12)
    private String inn;

    @Column(name = "contact_person", length = 200)
    private String contactPerson;

    @Column(name = "contact_email", length = 200)
    private String contactEmail;

    @Column(name = "contact_phone", length = 50)
    private String contactPhone;

    @Column(name = "work_type", length = 100)
    private String workType;

    // --- Финансовая устойчивость ---
    @Column(name = "annual_revenue", precision = 18, scale = 2)
    private BigDecimal annualRevenue;

    @Column(name = "years_in_business")
    private Integer yearsInBusiness;

    @Column(name = "has_no_debts")
    @Builder.Default
    private Boolean hasNoDebts = false;

    @Column(name = "has_credit_line")
    @Builder.Default
    private Boolean hasCreditLine = false;

    // --- Опыт ---
    @Column(name = "similar_projects_count")
    private Integer similarProjectsCount;

    @Column(name = "max_project_value", precision = 18, scale = 2)
    private BigDecimal maxProjectValue;

    @Column(name = "has_references")
    @Builder.Default
    private Boolean hasReferences = false;

    // --- Лицензии и допуски ---
    @Column(name = "has_sro_membership")
    @Builder.Default
    private Boolean hasSroMembership = false;

    @Column(name = "sro_number", length = 100)
    private String sroNumber;

    @Column(name = "has_iso_certification")
    @Builder.Default
    private Boolean hasIsoCertification = false;

    @Column(name = "has_safety_certification")
    @Builder.Default
    private Boolean hasSafetyCertification = false;

    // --- Безопасность ---
    @Column(name = "ltir")
    private BigDecimal ltir;

    @Column(name = "has_safety_plan")
    @Builder.Default
    private Boolean hasSafetyPlan = false;

    @Column(name = "no_fatal_incidents_3y")
    @Builder.Default
    private Boolean noFatalIncidents3y = false;

    // --- Страхование ---
    @Column(name = "has_liability_insurance")
    @Builder.Default
    private Boolean hasLiabilityInsurance = false;

    @Column(name = "insurance_coverage", precision = 18, scale = 2)
    private BigDecimal insuranceCoverage;

    @Column(name = "can_provide_bank_guarantee")
    @Builder.Default
    private Boolean canProvideBankGuarantee = false;

    // --- Ресурсы ---
    @Column(name = "employee_count")
    private Integer employeeCount;

    @Column(name = "has_own_equipment")
    @Builder.Default
    private Boolean hasOwnEquipment = false;

    @Column(name = "has_own_transport")
    @Builder.Default
    private Boolean hasOwnTransport = false;

    // --- Скоринг ---
    @Column(name = "total_score")
    private Integer totalScore;

    @Column(name = "financial_score")
    private Integer financialScore;

    @Column(name = "experience_score")
    private Integer experienceScore;

    @Column(name = "safety_score")
    private Integer safetyScore;

    @Column(name = "qualification_result", length = 30)
    @Builder.Default
    private String qualificationResult = "PENDING";

    @Column(name = "notes", columnDefinition = "TEXT")
    private String notes;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 30)
    @Builder.Default
    private PrequalificationStatus status = PrequalificationStatus.PENDING;

    @Column(name = "evaluated_at")
    private LocalDate evaluatedAt;

    @Column(name = "evaluated_by", length = 200)
    private String evaluatedBy;

    public void calculateScore() {
        int fin = 0, exp = 0, safe = 0;

        if (Boolean.TRUE.equals(hasNoDebts)) fin += 2;
        if (Boolean.TRUE.equals(hasCreditLine)) fin++;
        if (annualRevenue != null && annualRevenue.compareTo(BigDecimal.valueOf(50_000_000)) > 0) fin += 2;
        if (yearsInBusiness != null && yearsInBusiness >= 5) fin += 2;
        if (yearsInBusiness != null && yearsInBusiness >= 10) fin++;

        if (similarProjectsCount != null && similarProjectsCount >= 3) exp += 2;
        if (similarProjectsCount != null && similarProjectsCount >= 10) exp++;
        if (Boolean.TRUE.equals(hasReferences)) exp += 2;
        if (maxProjectValue != null && maxProjectValue.compareTo(BigDecimal.valueOf(100_000_000)) > 0) exp++;

        if (Boolean.TRUE.equals(hasSroMembership)) safe += 2;
        if (Boolean.TRUE.equals(hasIsoCertification)) safe++;
        if (Boolean.TRUE.equals(hasSafetyCertification)) safe++;
        if (Boolean.TRUE.equals(hasSafetyPlan)) safe++;
        if (Boolean.TRUE.equals(noFatalIncidents3y)) safe += 2;
        if (Boolean.TRUE.equals(hasLiabilityInsurance)) safe++;
        if (Boolean.TRUE.equals(canProvideBankGuarantee)) safe++;

        this.financialScore = fin;
        this.experienceScore = exp;
        this.safetyScore = safe;
        this.totalScore = fin + exp + safe;

        if (totalScore >= 16) this.qualificationResult = "QUALIFIED";
        else if (totalScore >= 10) this.qualificationResult = "CONDITIONALLY_QUALIFIED";
        else this.qualificationResult = "NOT_QUALIFIED";
    }
}
