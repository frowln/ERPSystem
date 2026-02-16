package com.privod.platform.modules.specification.repository;

import com.privod.platform.modules.specification.domain.MaterialAnalog;
import com.privod.platform.modules.specification.domain.SubstitutionType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface MaterialAnalogRepository extends JpaRepository<MaterialAnalog, UUID>,
        JpaSpecificationExecutor<MaterialAnalog> {

    Page<MaterialAnalog> findByDeletedFalse(Pageable pageable);

    List<MaterialAnalog> findByOriginalMaterialIdAndIsActiveTrueAndDeletedFalse(UUID originalMaterialId);

    Page<MaterialAnalog> findByOriginalMaterialIdAndDeletedFalse(UUID originalMaterialId, Pageable pageable);

    List<MaterialAnalog> findByAnalogMaterialIdAndIsActiveTrueAndDeletedFalse(UUID analogMaterialId);

    List<MaterialAnalog> findBySubstitutionTypeAndIsActiveTrueAndDeletedFalse(SubstitutionType substitutionType);
}
