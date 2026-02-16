package com.privod.platform.modules.integration.pricing.repository;

import com.privod.platform.modules.integration.pricing.domain.PriceRate;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface PriceRateRepository extends JpaRepository<PriceRate, UUID>,
        JpaSpecificationExecutor<PriceRate> {

    Page<PriceRate> findByDatabaseIdAndDeletedFalse(UUID databaseId, Pageable pageable);

    Optional<PriceRate> findByCodeAndDeletedFalse(String code);

    List<PriceRate> findByCodeAndDatabaseIdAndDeletedFalse(String code, UUID databaseId);

    Page<PriceRate> findByCategoryAndDeletedFalse(String category, Pageable pageable);

    @Query("SELECT r FROM PriceRate r WHERE r.deleted = false AND r.databaseId = :databaseId " +
            "AND (LOWER(r.name) LIKE LOWER(CONCAT('%', :search, '%')) " +
            "OR LOWER(r.code) LIKE LOWER(CONCAT('%', :search, '%')) " +
            "OR LOWER(r.category) LIKE LOWER(CONCAT('%', :search, '%')))")
    Page<PriceRate> searchByDatabaseAndQuery(@Param("databaseId") UUID databaseId,
                                              @Param("search") String search,
                                              Pageable pageable);

    @Query("SELECT r FROM PriceRate r WHERE r.deleted = false " +
            "AND (LOWER(r.name) LIKE LOWER(CONCAT('%', :search, '%')) " +
            "OR LOWER(r.code) LIKE LOWER(CONCAT('%', :search, '%')) " +
            "OR LOWER(r.category) LIKE LOWER(CONCAT('%', :search, '%')))")
    Page<PriceRate> searchByQuery(@Param("search") String search, Pageable pageable);

    long countByDatabaseIdAndDeletedFalse(UUID databaseId);
}
