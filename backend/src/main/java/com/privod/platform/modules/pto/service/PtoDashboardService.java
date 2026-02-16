package com.privod.platform.modules.pto.service;

import com.privod.platform.modules.pto.domain.LabTestConclusion;
import com.privod.platform.modules.pto.domain.SubmittalStatus;
import com.privod.platform.modules.pto.domain.WorkPermitStatus;
import com.privod.platform.modules.quality.domain.MaterialCertificateStatus;
import com.privod.platform.modules.pto.repository.ActOsvidetelstvovanieRepository;
import com.privod.platform.modules.pto.repository.LabTestRepository;
import com.privod.platform.modules.pto.repository.PtoMaterialCertificateRepository;
import com.privod.platform.modules.pto.repository.PtoDocumentRepository;
import com.privod.platform.modules.pto.repository.QualityPlanRepository;
import com.privod.platform.modules.pto.repository.SubmittalRepository;
import com.privod.platform.modules.pto.repository.WorkPermitRepository;
import com.privod.platform.modules.pto.web.dto.PtoDashboardResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class PtoDashboardService {

    private final PtoDocumentRepository documentRepository;
    private final WorkPermitRepository workPermitRepository;
    private final SubmittalRepository submittalRepository;
    private final LabTestRepository labTestRepository;
    private final PtoMaterialCertificateRepository certificateRepository;
    private final ActOsvidetelstvovanieRepository actRepository;
    private final QualityPlanRepository qualityPlanRepository;

    @Transactional(readOnly = true)
    public PtoDashboardResponse getDashboard(UUID projectId) {
        long totalDocuments = documentRepository.countByProjectIdAndDeletedFalse(projectId);
        long totalWorkPermits = workPermitRepository.countByProjectIdAndDeletedFalse(projectId);
        long activeWorkPermits = workPermitRepository
                .findByProjectIdAndStatusAndDeletedFalse(projectId, WorkPermitStatus.ACTIVE).size();
        long totalSubmittals = submittalRepository.countByProjectIdAndDeletedFalse(projectId);
        long pendingSubmittals = submittalRepository
                .findByProjectIdAndStatusAndDeletedFalse(projectId, SubmittalStatus.SUBMITTED).size();
        long totalLabTests = labTestRepository.countByProjectIdAndDeletedFalse(projectId);
        long failedLabTests = labTestRepository
                .findByProjectIdAndConclusionAndDeletedFalse(projectId, LabTestConclusion.FAILED).size();
        long totalCertificates = certificateRepository.countByDeletedFalse();
        long expiredCertificates = certificateRepository
                .countByStatusAndDeletedFalse(MaterialCertificateStatus.EXPIRED);
        long totalActs = actRepository.findByProjectIdAndDeletedFalse(projectId).size();
        long totalQualityPlans = qualityPlanRepository.findByProjectIdAndDeletedFalse(projectId).size();

        return new PtoDashboardResponse(
                totalDocuments,
                totalWorkPermits,
                activeWorkPermits,
                totalSubmittals,
                pendingSubmittals,
                totalLabTests,
                failedLabTests,
                totalCertificates,
                expiredCertificates,
                totalActs,
                totalQualityPlans
        );
    }
}
