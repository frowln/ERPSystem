package com.privod.platform.modules.warehouse.repository;

import com.privod.platform.modules.warehouse.domain.UnitOfMeasure;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface UnitOfMeasureRepository extends JpaRepository<UnitOfMeasure, UUID> {

    Optional<UnitOfMeasure> findByOkeiCodeAndDeletedFalse(String okeiCode);

    Optional<UnitOfMeasure> findBySymbolAndDeletedFalse(String symbol);

    List<UnitOfMeasure> findByActiveAndDeletedFalseOrderByName(boolean active);

    Page<UnitOfMeasure> findByDeletedFalse(Pageable pageable);

    Page<UnitOfMeasure> findByQuantityGroupAndDeletedFalse(String quantityGroup, Pageable pageable);

    boolean existsByOkeiCodeAndDeletedFalse(String okeiCode);
}
