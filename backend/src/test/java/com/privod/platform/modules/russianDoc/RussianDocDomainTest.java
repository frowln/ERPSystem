package com.privod.platform.modules.russianDoc;

import com.privod.platform.modules.kep.domain.KepCertificate;
import com.privod.platform.modules.russianDoc.domain.KepCertificateStatus;
import com.privod.platform.modules.russianDoc.domain.KepSignatureRequest;
import com.privod.platform.modules.russianDoc.domain.KepSignatureRequestStatus;
import com.privod.platform.modules.russianDoc.domain.PowerOfAttorney;
import com.privod.platform.modules.russianDoc.domain.RussianDocStatus;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;

import java.time.LocalDate;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;

class RussianDocDomainTest {

    @Nested
    @DisplayName("RussianDocStatus Transitions")
    class StatusTransitionTests {

        @Test
        @DisplayName("DRAFT can transition to CONFIRMED")
        void draft_CanTransitionToConfirmed() {
            assertThat(RussianDocStatus.DRAFT.canTransitionTo(RussianDocStatus.CONFIRMED)).isTrue();
        }

        @Test
        @DisplayName("DRAFT can transition to CANCELLED")
        void draft_CanTransitionToCancelled() {
            assertThat(RussianDocStatus.DRAFT.canTransitionTo(RussianDocStatus.CANCELLED)).isTrue();
        }

        @Test
        @DisplayName("DRAFT cannot transition to POSTED")
        void draft_CannotTransitionToPosted() {
            assertThat(RussianDocStatus.DRAFT.canTransitionTo(RussianDocStatus.POSTED)).isFalse();
        }

        @Test
        @DisplayName("CONFIRMED can transition to POSTED")
        void confirmed_CanTransitionToPosted() {
            assertThat(RussianDocStatus.CONFIRMED.canTransitionTo(RussianDocStatus.POSTED)).isTrue();
        }

        @Test
        @DisplayName("CANCELLED cannot transition to any status")
        void cancelled_CannotTransition() {
            assertThat(RussianDocStatus.CANCELLED.canTransitionTo(RussianDocStatus.DRAFT)).isFalse();
            assertThat(RussianDocStatus.CANCELLED.canTransitionTo(RussianDocStatus.CONFIRMED)).isFalse();
            assertThat(RussianDocStatus.CANCELLED.canTransitionTo(RussianDocStatus.POSTED)).isFalse();
        }
    }

    @Nested
    @DisplayName("KepCertificate Validity")
    class CertificateValidityTests {

        @Test
        @DisplayName("Certificate is valid when active and within date range")
        void isValid_ActiveAndWithinRange() {
            KepCertificate cert = KepCertificate.builder()
                    .owner("Test User")
                    .serialNumber("SN001")
                    .issuer("Test CA")
                    .validFrom(LocalDate.now().minusMonths(1))
                    .validTo(LocalDate.now().plusMonths(1))
                    .thumbprint("TH001")
                    .status(KepCertificateStatus.ACTIVE)
                    .build();

            assertThat(cert.isValid()).isTrue();
        }

        @Test
        @DisplayName("Certificate is invalid when expired")
        void isValid_ExpiredDate() {
            KepCertificate cert = KepCertificate.builder()
                    .owner("Test User")
                    .serialNumber("SN002")
                    .issuer("Test CA")
                    .validFrom(LocalDate.now().minusYears(2))
                    .validTo(LocalDate.now().minusDays(1))
                    .thumbprint("TH002")
                    .status(KepCertificateStatus.ACTIVE)
                    .build();

            assertThat(cert.isValid()).isFalse();
        }

        @Test
        @DisplayName("Certificate is invalid when revoked")
        void isValid_RevokedStatus() {
            KepCertificate cert = KepCertificate.builder()
                    .owner("Test User")
                    .serialNumber("SN003")
                    .issuer("Test CA")
                    .validFrom(LocalDate.now().minusMonths(1))
                    .validTo(LocalDate.now().plusMonths(1))
                    .thumbprint("TH003")
                    .status(KepCertificateStatus.REVOKED)
                    .build();

            assertThat(cert.isValid()).isFalse();
        }
    }

    @Nested
    @DisplayName("PowerOfAttorney Expiry")
    class PowerOfAttorneyExpiryTests {

        @Test
        @DisplayName("Not expired when validUntil is in the future")
        void isExpired_FutureDate_NotExpired() {
            PowerOfAttorney poa = PowerOfAttorney.builder()
                    .number("М2-001")
                    .date(LocalDate.now())
                    .issuedToId(UUID.randomUUID())
                    .validUntil(LocalDate.now().plusDays(15))
                    .materialList("[]")
                    .build();

            assertThat(poa.isExpired()).isFalse();
        }

        @Test
        @DisplayName("Expired when validUntil is in the past")
        void isExpired_PastDate_Expired() {
            PowerOfAttorney poa = PowerOfAttorney.builder()
                    .number("М2-002")
                    .date(LocalDate.now().minusMonths(1))
                    .issuedToId(UUID.randomUUID())
                    .validUntil(LocalDate.now().minusDays(1))
                    .materialList("[]")
                    .build();

            assertThat(poa.isExpired()).isTrue();
        }
    }

    @Nested
    @DisplayName("KepSignatureRequest Overdue")
    class SignatureRequestOverdueTests {

        @Test
        @DisplayName("Pending request with past due date is overdue")
        void isOverdue_PastDueDate() {
            KepSignatureRequest req = KepSignatureRequest.builder()
                    .documentType("UPD")
                    .documentId(UUID.randomUUID())
                    .requestedById(UUID.randomUUID())
                    .requestedToId(UUID.randomUUID())
                    .status(KepSignatureRequestStatus.PENDING)
                    .dueDate(LocalDate.now().minusDays(1))
                    .build();

            assertThat(req.isOverdue()).isTrue();
        }

        @Test
        @DisplayName("Signed request is not overdue even if past due date")
        void isOverdue_SignedNotOverdue() {
            KepSignatureRequest req = KepSignatureRequest.builder()
                    .documentType("UPD")
                    .documentId(UUID.randomUUID())
                    .requestedById(UUID.randomUUID())
                    .requestedToId(UUID.randomUUID())
                    .status(KepSignatureRequestStatus.SIGNED)
                    .dueDate(LocalDate.now().minusDays(1))
                    .build();

            assertThat(req.isOverdue()).isFalse();
        }
    }

    @Nested
    @DisplayName("Enum Display Names")
    class EnumDisplayNameTests {

        @Test
        @DisplayName("Russian doc statuses have Russian display names")
        void russianDocStatus_DisplayNames() {
            assertThat(RussianDocStatus.DRAFT.getDisplayName()).isEqualTo("Черновик");
            assertThat(RussianDocStatus.CONFIRMED.getDisplayName()).isEqualTo("Подтверждён");
            assertThat(RussianDocStatus.POSTED.getDisplayName()).isEqualTo("Проведён");
            assertThat(RussianDocStatus.CANCELLED.getDisplayName()).isEqualTo("Отменён");
        }

        @Test
        @DisplayName("KEP certificate statuses have Russian display names")
        void kepCertificateStatus_DisplayNames() {
            assertThat(KepCertificateStatus.ACTIVE.getDisplayName()).isEqualTo("Активен");
            assertThat(KepCertificateStatus.EXPIRED.getDisplayName()).isEqualTo("Истёк");
            assertThat(KepCertificateStatus.REVOKED.getDisplayName()).isEqualTo("Отозван");
        }
    }
}
