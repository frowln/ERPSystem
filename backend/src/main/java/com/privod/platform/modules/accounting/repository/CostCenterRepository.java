package com.privod.platform.modules.accounting.repository;

import com.privod.platform.modules.accounting.domain.CostCenter;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface CostCenterRepository extends JpaRepository<CostCenter, UUID> {

    Optional<CostCenter> findByCodeAndDeletedFalse(String code);

    Page<CostCenter> findByDeletedFalse(Pageable pageable);

    List<CostCenter> findByProjectIdAndDeletedFalse(UUID projectId);

    List<CostCenter> findByParentIdAndDeletedFalse(UUID parentId);
}
