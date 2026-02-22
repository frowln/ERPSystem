package com.privod.platform.modules.russianDoc.repository;

import com.privod.platform.modules.russianDoc.domain.OcrEstimateResult;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface OcrEstimateResultRepository extends JpaRepository<OcrEstimateResult, UUID> {

    List<OcrEstimateResult> findByOcrTaskIdAndDeletedFalseOrderByLineNumberAsc(UUID ocrTaskId);

    List<OcrEstimateResult> findByOcrTaskIdAndAcceptedTrueAndDeletedFalse(UUID ocrTaskId);

    long countByOcrTaskIdAndDeletedFalse(UUID ocrTaskId);

    Optional<OcrEstimateResult> findByIdAndDeletedFalse(UUID id);
}
