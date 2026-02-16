package com.privod.platform.modules.integration.sms.repository;

import com.privod.platform.modules.integration.sms.domain.SmsChannel;
import com.privod.platform.modules.integration.sms.domain.SmsMessage;
import com.privod.platform.modules.integration.sms.domain.SmsMessageStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface SmsMessageRepository extends JpaRepository<SmsMessage, UUID> {

    Page<SmsMessage> findByDeletedFalse(Pageable pageable);

    Page<SmsMessage> findByChannelAndDeletedFalse(SmsChannel channel, Pageable pageable);

    Page<SmsMessage> findByStatusAndDeletedFalse(SmsMessageStatus status, Pageable pageable);

    Page<SmsMessage> findByPhoneNumberAndDeletedFalse(String phoneNumber, Pageable pageable);

    Page<SmsMessage> findByUserIdAndDeletedFalse(UUID userId, Pageable pageable);

    List<SmsMessage> findByStatusAndDeletedFalseOrderByCreatedAtAsc(SmsMessageStatus status);

    Optional<SmsMessage> findByExternalIdAndDeletedFalse(String externalId);

    Page<SmsMessage> findByRelatedEntityTypeAndRelatedEntityIdAndDeletedFalse(
            String entityType, UUID entityId, Pageable pageable);
}
