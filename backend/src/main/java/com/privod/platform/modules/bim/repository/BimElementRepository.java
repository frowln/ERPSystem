package com.privod.platform.modules.bim.repository;

import com.privod.platform.modules.bim.domain.BimElement;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface BimElementRepository extends JpaRepository<BimElement, UUID> {

    Page<BimElement> findByModelIdAndDeletedFalse(UUID modelId, Pageable pageable);

    Page<BimElement> findByDeletedFalse(Pageable pageable);

    List<BimElement> findByModelIdAndIfcTypeAndDeletedFalse(UUID modelId, String ifcType);

    long countByModelIdAndDeletedFalse(UUID modelId);
}
