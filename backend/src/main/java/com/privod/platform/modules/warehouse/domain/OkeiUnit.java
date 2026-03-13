package com.privod.platform.modules.warehouse.domain;

import com.privod.platform.infrastructure.persistence.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * P1-WAR-1: Справочник единиц измерения ОКЕИ (ОК 015-94).
 * Используется для валидации поля unitOfMeasure в Material и других сущностях.
 */
@Entity
@Table(name = "okei_units")
@Getter @Setter @Builder @NoArgsConstructor @AllArgsConstructor
public class OkeiUnit extends BaseEntity {

    /** Код ОКЕИ (3-4 символа, напр. "006" = м²) */
    @Column(name = "code", nullable = false, unique = true, length = 10)
    private String code;

    /** Наименование на русском */
    @Column(name = "name_ru", nullable = false, length = 200)
    private String nameRu;

    /** Буквенное обозначение (м², кг, шт.) */
    @Column(name = "symbol_ru", nullable = false, length = 50)
    private String symbolRu;

    /** Наименование на английском */
    @Column(name = "name_en", length = 200)
    private String nameEn;

    /** English symbol */
    @Column(name = "symbol_en", length = 50)
    private String symbolEn;

    /** Категория (длина, масса, объём, площадь, количество, ...) */
    @Column(name = "category", length = 50)
    private String category;

    @Column(name = "is_active", nullable = false)
    @Builder.Default
    private boolean active = true;
}
