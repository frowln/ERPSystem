package com.privod.platform.modules.legal.repository;

import com.privod.platform.modules.legal.domain.LegalRemark;
import com.privod.platform.modules.legal.domain.RemarkType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface LegalRemarkRepository extends JpaRepository<LegalRemark, UUID> {

    Optional<LegalRemark> findByIdAndDeletedFalse(UUID id);

    List<LegalRemark> findByCaseIdAndDeletedFalseOrderByRemarkDateDesc(UUID caseId);

    Page<LegalRemark> findByCaseIdAndDeletedFalse(UUID caseId, Pageable pageable);

    List<LegalRemark> findByCaseIdAndRemarkTypeAndDeletedFalse(UUID caseId, RemarkType remarkType);

    List<LegalRemark> findByCaseIdAndConfidentialFalseAndDeletedFalseOrderByRemarkDateDesc(UUID caseId);

    long countByCaseIdAndDeletedFalse(UUID caseId);
}
