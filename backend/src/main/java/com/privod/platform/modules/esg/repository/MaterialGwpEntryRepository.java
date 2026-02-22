package com.privod.platform.modules.esg.repository;

import com.privod.platform.modules.esg.domain.EsgMaterialCategory;
import com.privod.platform.modules.esg.domain.MaterialGwpEntry;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface MaterialGwpEntryRepository extends JpaRepository<MaterialGwpEntry, UUID> {

    Page<MaterialGwpEntry> findByDeletedFalse(Pageable pageable);

    Page<MaterialGwpEntry> findByMaterialCategoryAndDeletedFalse(EsgMaterialCategory category, Pageable pageable);

    List<MaterialGwpEntry> findByMaterialCategoryAndDeletedFalse(EsgMaterialCategory category);

    Optional<MaterialGwpEntry> findByIdAndDeletedFalse(UUID id);

    @Query("SELECT g FROM MaterialGwpEntry g WHERE g.deleted = false AND " +
            "LOWER(g.name) LIKE LOWER(CONCAT('%', :search, '%'))")
    Page<MaterialGwpEntry> searchByName(@Param("search") String search, Pageable pageable);

    @Query("SELECT g FROM MaterialGwpEntry g WHERE g.deleted = false AND g.isVerified = true")
    List<MaterialGwpEntry> findAllVerified();

    @Query("SELECT g FROM MaterialGwpEntry g WHERE g.deleted = false AND g.isVerified = true " +
            "AND g.materialCategory = :category")
    List<MaterialGwpEntry> findVerifiedByCategory(@Param("category") EsgMaterialCategory category);
}
