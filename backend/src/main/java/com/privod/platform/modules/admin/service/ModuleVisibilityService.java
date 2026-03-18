package com.privod.platform.modules.admin.service;

import com.privod.platform.infrastructure.security.SecurityUtils;
import com.privod.platform.modules.admin.domain.ModuleVisibility;
import com.privod.platform.modules.admin.repository.ModuleVisibilityRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional(readOnly = true)
public class ModuleVisibilityService {

    private final ModuleVisibilityRepository repository;

    public List<String> getDisabledModules() {
        UUID orgId = SecurityUtils.requireCurrentOrganizationId();
        return repository.findByOrganizationIdAndDeletedFalse(orgId)
                .map(ModuleVisibility::getDisabledModules)
                .orElse(List.of());
    }

    @Transactional
    public List<String> updateDisabledModules(List<String> disabledModules) {
        UUID orgId = SecurityUtils.requireCurrentOrganizationId();
        ModuleVisibility mv = repository.findByOrganizationIdAndDeletedFalse(orgId)
                .orElseGet(() -> {
                    ModuleVisibility newMv = new ModuleVisibility();
                    newMv.setOrganizationId(orgId);
                    newMv.setDisabledModules(new ArrayList<>());
                    return newMv;
                });
        mv.setDisabledModules(new ArrayList<>(disabledModules));
        repository.save(mv);
        log.info("Module visibility updated for org {}: {} modules disabled", orgId, disabledModules.size());
        return mv.getDisabledModules();
    }
}
