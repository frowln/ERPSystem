package com.privod.platform.modules.notification.service;

import com.privod.platform.modules.notification.domain.NotificationCategory;
import com.privod.platform.modules.notification.domain.NotificationChannel;
import com.privod.platform.modules.notification.domain.NotificationPreference;
import com.privod.platform.modules.notification.repository.NotificationPreferenceRepository;
import com.privod.platform.modules.notification.web.dto.NotificationPreferenceResponse;
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
public class NotificationPreferenceService {

    private final NotificationPreferenceRepository preferenceRepository;

    /**
     * Returns all notification preferences for the given user and organization.
     * If no preferences exist yet, creates default entries (all enabled) for every
     * channel/category combination.
     */
    @Transactional
    public List<NotificationPreferenceResponse> getPreferences(UUID userId, UUID organizationId) {
        List<NotificationPreference> existing = preferenceRepository
                .findByUserIdAndOrganizationId(userId, organizationId);

        if (existing.isEmpty()) {
            existing = createDefaults(userId, organizationId);
            log.info("Created {} default notification preferences for user {} in org {}",
                    existing.size(), userId, organizationId);
        }

        return existing.stream()
                .map(NotificationPreferenceResponse::fromEntity)
                .toList();
    }

    /**
     * Upserts a single notification preference. Creates the record if it does not
     * exist; otherwise updates the enabled flag.
     */
    @Transactional
    public NotificationPreferenceResponse updatePreference(UUID userId, UUID organizationId,
                                                           NotificationChannel channel,
                                                           NotificationCategory category,
                                                           boolean enabled) {
        NotificationPreference preference = preferenceRepository
                .findByUserIdAndOrganizationIdAndChannelAndCategory(userId, organizationId, channel, category)
                .orElseGet(() -> NotificationPreference.builder()
                        .userId(userId)
                        .organizationId(organizationId)
                        .channel(channel)
                        .category(category)
                        .build());

        preference.setEnabled(enabled);
        preference = preferenceRepository.save(preference);

        log.info("Updated notification preference for user {} (org {}): {} / {} = {}",
                userId, organizationId, channel, category, enabled);

        return NotificationPreferenceResponse.fromEntity(preference);
    }

    /**
     * Checks whether a specific notification channel+category is enabled for the
     * given user. Returns {@code true} by default (opt-out model) when no
     * preference record exists.
     */
    @Transactional(readOnly = true)
    public boolean isEnabled(UUID userId, UUID organizationId,
                             NotificationChannel channel, NotificationCategory category) {
        return preferenceRepository
                .findByUserIdAndOrganizationIdAndChannelAndCategory(userId, organizationId, channel, category)
                .map(NotificationPreference::isEnabled)
                .orElse(true);
    }

    // ---------------------------------------------------------------
    // Private helpers
    // ---------------------------------------------------------------

    private List<NotificationPreference> createDefaults(UUID userId, UUID organizationId) {
        List<NotificationPreference> defaults = new ArrayList<>();
        for (NotificationChannel channel : NotificationChannel.values()) {
            for (NotificationCategory category : NotificationCategory.values()) {
                defaults.add(NotificationPreference.builder()
                        .userId(userId)
                        .organizationId(organizationId)
                        .channel(channel)
                        .category(category)
                        .enabled(true)
                        .build());
            }
        }
        return preferenceRepository.saveAll(defaults);
    }
}
