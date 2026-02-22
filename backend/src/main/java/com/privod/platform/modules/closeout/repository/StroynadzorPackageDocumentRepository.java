package com.privod.platform.modules.closeout.repository;

import com.privod.platform.modules.closeout.domain.DocumentCategory;
import com.privod.platform.modules.closeout.domain.PackageDocumentStatus;
import com.privod.platform.modules.closeout.domain.StroynadzorPackageDocument;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface StroynadzorPackageDocumentRepository extends JpaRepository<StroynadzorPackageDocument, UUID> {

    List<StroynadzorPackageDocument> findByPackageIdAndDeletedFalseOrderBySectionNumberAsc(UUID packageId);

    List<StroynadzorPackageDocument> findByPackageIdAndDocumentCategoryAndDeletedFalse(UUID packageId, DocumentCategory category);

    long countByPackageIdAndStatusAndDeletedFalse(UUID packageId, PackageDocumentStatus status);
}
