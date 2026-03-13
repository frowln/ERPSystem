package com.privod.platform.modules.hr.domain;

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
import org.hibernate.annotations.Filter;

import java.time.LocalDate;
import java.util.UUID;

/**
 * Медицинский осмотр работника (Приказ Минздрава №29н от 28.01.2021).
 * Учитываются предварительные (при поступлении), периодические и внеплановые осмотры.
 */
@Entity
@Table(name = "medical_exams", indexes = {
        @Index(name = "idx_medical_exam_org", columnList = "organization_id"),
        @Index(name = "idx_medical_exam_employee", columnList = "employee_id"),
        @Index(name = "idx_medical_exam_next_date", columnList = "next_exam_date")
})
@Filter(name = "tenantFilter", condition = "organization_id = :organizationId")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MedicalExam extends BaseEntity {

    @Column(name = "organization_id", nullable = false)
    private UUID organizationId;

    @Column(name = "employee_id", nullable = false)
    private UUID employeeId;

    /** Дата проведения осмотра. */
    @Column(name = "exam_date", nullable = false)
    private LocalDate examDate;

    /** Плановая дата следующего осмотра. */
    @Column(name = "next_exam_date")
    private LocalDate nextExamDate;

    /** Вид осмотра: предварительный, периодический, внеплановый. */
    @Enumerated(EnumType.STRING)
    @Column(name = "exam_type", nullable = false, length = 30)
    @Builder.Default
    private MedicalExamType examType = MedicalExamType.PERIODIC;

    /** Заключение: допущен, не допущен, допущен с ограничениями. */
    @Enumerated(EnumType.STRING)
    @Column(name = "result", nullable = false, length = 30)
    @Builder.Default
    private MedicalExamResult result = MedicalExamResult.ADMITTED;

    /** ФИО врача-терапевта, выдавшего заключение. */
    @Column(name = "doctor_name", length = 300)
    private String doctorName;

    /** Наименование медицинской организации. */
    @Column(name = "clinic_name", length = 500)
    private String clinicName;

    /** Примечания / ограничения. */
    @Column(name = "notes", columnDefinition = "TEXT")
    private String notes;
}
