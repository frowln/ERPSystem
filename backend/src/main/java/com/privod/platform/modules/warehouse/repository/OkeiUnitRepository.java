package com.privod.platform.modules.warehouse.repository;

import com.privod.platform.modules.warehouse.domain.OkeiUnit;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface OkeiUnitRepository extends JpaRepository<OkeiUnit, UUID> {

    Optional<OkeiUnit> findByCodeAndDeletedFalse(String code);

    Optional<OkeiUnit> findBySymbolRuIgnoreCaseAndDeletedFalse(String symbolRu);

    List<OkeiUnit> findByDeletedFalseAndActiveTrue();

    List<OkeiUnit> findByCategoryIgnoreCaseAndDeletedFalse(String category);

    boolean existsByCodeAndDeletedFalse(String code);

    boolean existsBySymbolRuIgnoreCaseAndDeletedFalse(String symbolRu);
}
