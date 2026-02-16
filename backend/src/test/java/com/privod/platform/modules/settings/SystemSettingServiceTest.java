package com.privod.platform.modules.settings;

import com.privod.platform.infrastructure.audit.AuditService;
import com.privod.platform.modules.settings.domain.SettingCategory;
import com.privod.platform.modules.settings.domain.SettingType;
import com.privod.platform.modules.settings.domain.SystemSetting;
import com.privod.platform.modules.settings.repository.SystemSettingRepository;
import com.privod.platform.modules.settings.service.SettingEncryptionService;
import com.privod.platform.modules.settings.service.SystemSettingService;
import com.privod.platform.modules.settings.web.dto.SystemSettingResponse;
import com.privod.platform.modules.settings.web.dto.UpdateSystemSettingRequest;
import jakarta.persistence.EntityNotFoundException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class SystemSettingServiceTest {

    @Mock
    private SystemSettingRepository systemSettingRepository;

    @Mock
    private SettingEncryptionService encryptionService;

    @Mock
    private AuditService auditService;

    @InjectMocks
    private SystemSettingService systemSettingService;

    private SystemSetting companyNameSetting;
    private SystemSetting smtpPasswordSetting;
    private UUID settingId;

    @BeforeEach
    void setUp() {
        settingId = UUID.randomUUID();

        companyNameSetting = SystemSetting.builder()
                .settingKey("company_name")
                .settingValue("ООО ПРИВОД")
                .settingType(SettingType.STRING)
                .category(SettingCategory.GENERAL)
                .displayName("Название компании")
                .description("Юридическое название организации")
                .isEditable(true)
                .isEncrypted(false)
                .build();
        companyNameSetting.setId(settingId);
        companyNameSetting.setCreatedAt(Instant.now());

        smtpPasswordSetting = SystemSetting.builder()
                .settingKey("smtp_password")
                .settingValue("encrypted_value")
                .settingType(SettingType.SECRET)
                .category(SettingCategory.EMAIL)
                .displayName("Пароль SMTP")
                .description("Пароль для SMTP аутентификации")
                .isEditable(true)
                .isEncrypted(true)
                .build();
        smtpPasswordSetting.setId(UUID.randomUUID());
        smtpPasswordSetting.setCreatedAt(Instant.now());
    }

    @Nested
    @DisplayName("Get Settings")
    class GetSettingsTests {

        @Test
        @DisplayName("Should return all settings sorted by category and key")
        void getAll_ReturnsAllSettings() {
            when(systemSettingRepository.findByDeletedFalseOrderByCategoryAscSettingKeyAsc())
                    .thenReturn(List.of(companyNameSetting, smtpPasswordSetting));

            List<SystemSettingResponse> result = systemSettingService.getAll();

            assertThat(result).hasSize(2);
            assertThat(result.get(0).settingKey()).isEqualTo("company_name");
            assertThat(result.get(0).settingValue()).isEqualTo("ООО ПРИВОД");
            // Secret value should be masked
            assertThat(result.get(1).settingValue()).isEqualTo("********");
        }

        @Test
        @DisplayName("Should return settings by category")
        void getByCategory_ReturnsFilteredSettings() {
            when(systemSettingRepository.findByCategoryAndDeletedFalseOrderBySettingKeyAsc(SettingCategory.GENERAL))
                    .thenReturn(List.of(companyNameSetting));

            List<SystemSettingResponse> result = systemSettingService.getByCategory(SettingCategory.GENERAL);

            assertThat(result).hasSize(1);
            assertThat(result.get(0).category()).isEqualTo(SettingCategory.GENERAL);
        }

        @Test
        @DisplayName("Should return setting by key")
        void getByKey_ReturnsSetting() {
            when(systemSettingRepository.findBySettingKeyAndDeletedFalse("company_name"))
                    .thenReturn(Optional.of(companyNameSetting));

            SystemSettingResponse result = systemSettingService.getByKey("company_name");

            assertThat(result.settingKey()).isEqualTo("company_name");
            assertThat(result.displayName()).isEqualTo("Название компании");
        }

        @Test
        @DisplayName("Should throw when setting key not found")
        void getByKey_NotFound() {
            when(systemSettingRepository.findBySettingKeyAndDeletedFalse("nonexistent"))
                    .thenReturn(Optional.empty());

            assertThatThrownBy(() -> systemSettingService.getByKey("nonexistent"))
                    .isInstanceOf(EntityNotFoundException.class)
                    .hasMessageContaining("Настройка не найдена");
        }

        @Test
        @DisplayName("Should decrypt encrypted setting value")
        void getValue_DecryptsEncryptedValue() {
            when(systemSettingRepository.findBySettingKeyAndDeletedFalse("smtp_password"))
                    .thenReturn(Optional.of(smtpPasswordSetting));
            when(encryptionService.decrypt("encrypted_value")).thenReturn("real_password");

            String value = systemSettingService.getValue("smtp_password");

            assertThat(value).isEqualTo("real_password");
            verify(encryptionService).decrypt("encrypted_value");
        }
    }

    @Nested
    @DisplayName("Update Settings")
    class UpdateSettingsTests {

        @Test
        @DisplayName("Should update editable setting")
        void updateSetting_Success() {
            when(systemSettingRepository.findBySettingKeyAndDeletedFalse("company_name"))
                    .thenReturn(Optional.of(companyNameSetting));
            when(systemSettingRepository.save(any(SystemSetting.class)))
                    .thenAnswer(inv -> inv.getArgument(0));

            UpdateSystemSettingRequest request = new UpdateSystemSettingRequest("ООО ПРИВОД-2");
            SystemSettingResponse result = systemSettingService.updateSetting("company_name", request);

            assertThat(result.settingKey()).isEqualTo("company_name");
            verify(auditService).logUpdate(eq("SystemSetting"), any(UUID.class),
                    eq("company_name"), eq("ООО ПРИВОД"), eq("ООО ПРИВОД-2"));
        }

        @Test
        @DisplayName("Should encrypt SECRET type on update")
        void updateSetting_EncryptsSecret() {
            when(systemSettingRepository.findBySettingKeyAndDeletedFalse("smtp_password"))
                    .thenReturn(Optional.of(smtpPasswordSetting));
            when(encryptionService.encrypt("new_password")).thenReturn("new_encrypted_value");
            when(systemSettingRepository.save(any(SystemSetting.class)))
                    .thenAnswer(inv -> inv.getArgument(0));

            UpdateSystemSettingRequest request = new UpdateSystemSettingRequest("new_password");
            systemSettingService.updateSetting("smtp_password", request);

            verify(encryptionService).encrypt("new_password");
        }

        @Test
        @DisplayName("Should reject update on non-editable setting")
        void updateSetting_NonEditable() {
            companyNameSetting.setEditable(false);
            when(systemSettingRepository.findBySettingKeyAndDeletedFalse("company_name"))
                    .thenReturn(Optional.of(companyNameSetting));

            UpdateSystemSettingRequest request = new UpdateSystemSettingRequest("new_value");

            assertThatThrownBy(() -> systemSettingService.updateSetting("company_name", request))
                    .isInstanceOf(IllegalStateException.class)
                    .hasMessageContaining("не подлежит редактированию");
        }

        @Test
        @DisplayName("Should validate INTEGER type setting value")
        void updateSetting_InvalidInteger() {
            SystemSetting intSetting = SystemSetting.builder()
                    .settingKey("session_timeout_minutes")
                    .settingValue("30")
                    .settingType(SettingType.INTEGER)
                    .category(SettingCategory.SECURITY)
                    .displayName("Тайм-аут сессии")
                    .isEditable(true)
                    .isEncrypted(false)
                    .build();
            intSetting.setId(UUID.randomUUID());
            intSetting.setCreatedAt(Instant.now());

            when(systemSettingRepository.findBySettingKeyAndDeletedFalse("session_timeout_minutes"))
                    .thenReturn(Optional.of(intSetting));

            UpdateSystemSettingRequest request = new UpdateSystemSettingRequest("not_a_number");

            assertThatThrownBy(() -> systemSettingService.updateSetting("session_timeout_minutes", request))
                    .isInstanceOf(IllegalArgumentException.class)
                    .hasMessageContaining("целым числом");
        }
    }
}
