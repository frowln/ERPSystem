package com.privod.platform.modules.procurementExt.repository;

import com.privod.platform.modules.specification.domain.MaterialAnalog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface ProcurementMaterialAnalogRepository extends JpaRepository<MaterialAnalog, UUID> {

    List<MaterialAnalog> findByOriginalMaterialIdAndDeletedFalse(UUID originalMaterialId);

    @Query("SELECT m FROM MaterialAnalog m WHERE m.approvedAt IS NOT NULL AND m.deleted = false")
    List<MaterialAnalog> findByApprovedAndDeletedFalse();

    @Query("SELECT m FROM MaterialAnalog m WHERE m.approvedAt IS NOT NULL AND m.deleted = false")
    List<MaterialAnalog> findByApprovedTrueAndDeletedFalse();
}
