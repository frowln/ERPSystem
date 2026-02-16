package com.privod.platform.modules.auth.service;

import com.privod.platform.modules.auth.domain.OidcProvider;
import com.privod.platform.modules.auth.repository.OidcProviderRepository;
import com.privod.platform.modules.auth.web.dto.CreateOidcProviderRequest;
import com.privod.platform.modules.auth.web.dto.OidcProviderResponse;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class OidcProviderService {

    private final OidcProviderRepository providerRepository;

    @Transactional
    public OidcProviderResponse create(CreateOidcProviderRequest request) {
        if (providerRepository.existsByCodeAndDeletedFalse(request.code())) {
            throw new IllegalArgumentException("OIDC провайдер с кодом уже существует: " + request.code());
        }

        OidcProvider provider = OidcProvider.builder()
                .code(request.code())
                .name(request.name())
                .clientId(request.clientId())
                .clientSecret(request.clientSecret())
                .authorizationUrl(request.authorizationUrl())
                .tokenUrl(request.tokenUrl())
                .userInfoUrl(request.userInfoUrl())
                .scope(request.scope() != null ? request.scope() : "openid email profile")
                .iconUrl(request.iconUrl())
                .isActive(true)
                .build();

        provider = providerRepository.save(provider);
        log.info("OIDC provider created: {} ({})", provider.getCode(), provider.getId());
        return OidcProviderResponse.fromEntity(provider);
    }

    @Transactional(readOnly = true)
    public List<OidcProviderResponse> getActiveProviders() {
        return providerRepository.findByIsActiveTrueAndDeletedFalse()
                .stream()
                .map(OidcProviderResponse::fromEntity)
                .toList();
    }

    @Transactional(readOnly = true)
    public OidcProviderResponse getProvider(String code) {
        OidcProvider provider = providerRepository.findByCodeAndDeletedFalse(code)
                .orElseThrow(() -> new EntityNotFoundException("OIDC провайдер не найден: " + code));
        return OidcProviderResponse.fromEntity(provider);
    }

    @Transactional
    public OidcProviderResponse toggleActive(String code, boolean active) {
        OidcProvider provider = providerRepository.findByCodeAndDeletedFalse(code)
                .orElseThrow(() -> new EntityNotFoundException("OIDC провайдер не найден: " + code));
        provider.setActive(active);
        provider = providerRepository.save(provider);
        log.info("OIDC provider {} set active={}", code, active);
        return OidcProviderResponse.fromEntity(provider);
    }

    @Transactional
    public void delete(UUID providerId) {
        OidcProvider provider = providerRepository.findById(providerId)
                .filter(p -> !p.isDeleted())
                .orElseThrow(() -> new EntityNotFoundException("OIDC провайдер не найден: " + providerId));
        provider.softDelete();
        providerRepository.save(provider);
        log.info("OIDC provider deleted: {}", provider.getCode());
    }
}
