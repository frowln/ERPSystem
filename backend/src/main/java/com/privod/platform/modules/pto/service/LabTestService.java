package com.privod.platform.modules.pto.service;

import com.privod.platform.infrastructure.audit.AuditService;
import com.privod.platform.modules.pto.domain.LabTest;
import com.privod.platform.modules.pto.repository.LabTestRepository;
import com.privod.platform.modules.pto.web.dto.CreateLabTestRequest;
import com.privod.platform.modules.pto.web.dto.LabTestResponse;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class LabTestService {

    private final LabTestRepository labTestRepository;
    private final PtoCodeGenerator codeGenerator;
    private final AuditService auditService;

    @Transactional(readOnly = true)
    public Page<LabTestResponse> listLabTests(UUID projectId, Pageable pageable) {
        return labTestRepository.findByProjectIdAndDeletedFalse(projectId, pageable)
                .map(LabTestResponse::fromEntity);
    }

    @Transactional(readOnly = true)
    public LabTestResponse getLabTest(UUID id) {
        LabTest test = getLabTestOrThrow(id);
        return LabTestResponse.fromEntity(test);
    }

    @Transactional
    public LabTestResponse createLabTest(CreateLabTestRequest request) {
        String code = codeGenerator.generateLabTestCode();

        LabTest test = LabTest.builder()
                .projectId(request.projectId())
                .code(code)
                .materialName(request.materialName())
                .testType(request.testType())
                .sampleNumber(request.sampleNumber())
                .testDate(request.testDate())
                .result(request.result())
                .conclusion(request.conclusion())
                .protocolUrl(request.protocolUrl())
                .labName(request.labName())
                .performedById(request.performedById())
                .build();

        test = labTestRepository.save(test);
        auditService.logCreate("LabTest", test.getId());

        log.info("Lab test created: {} ({}) for project {}", test.getCode(), test.getId(), request.projectId());
        return LabTestResponse.fromEntity(test);
    }

    @Transactional
    public void deleteLabTest(UUID id) {
        LabTest test = getLabTestOrThrow(id);
        test.softDelete();
        labTestRepository.save(test);
        auditService.logDelete("LabTest", id);
        log.info("Lab test deleted: {} ({})", test.getCode(), id);
    }

    private LabTest getLabTestOrThrow(UUID id) {
        return labTestRepository.findById(id)
                .filter(t -> !t.isDeleted())
                .orElseThrow(() -> new EntityNotFoundException("Лабораторное испытание не найдено: " + id));
    }
}
