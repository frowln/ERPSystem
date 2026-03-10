package com.privod.platform.modules.safety.service;

import com.privod.platform.infrastructure.security.SecurityUtils;
import com.privod.platform.modules.safety.domain.SoutCard;
import com.privod.platform.modules.safety.repository.SoutCardRepository;
import com.privod.platform.modules.safety.web.dto.SoutCardResponse;
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
public class SafetySoutService {

    private final SoutCardRepository soutCardRepository;

    @Transactional(readOnly = true)
    public Page<SoutCardResponse> listCards(UUID projectId, Pageable pageable) {
        UUID organizationId = SecurityUtils.requireCurrentOrganizationId();
        if (projectId != null) {
            return soutCardRepository.findByOrganizationIdAndProjectIdAndDeletedFalse(
                    organizationId, projectId, pageable)
                    .map(SoutCardResponse::fromEntity);
        }
        return soutCardRepository.findByOrganizationIdAndDeletedFalse(organizationId, pageable)
                .map(SoutCardResponse::fromEntity);
    }

    @Transactional(readOnly = true)
    public SoutCardResponse getCard(UUID id) {
        UUID organizationId = SecurityUtils.requireCurrentOrganizationId();
        SoutCard card = soutCardRepository.findByIdAndOrganizationIdAndDeletedFalse(id, organizationId)
                .orElseThrow(() -> new EntityNotFoundException("Карта СОУТ не найдена: " + id));
        return SoutCardResponse.fromEntity(card);
    }
}
