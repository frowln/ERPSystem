package com.privod.platform.modules.email.service;

import com.privod.platform.modules.email.domain.EmailMessage;
import com.privod.platform.modules.email.domain.EmailProjectLink;
import com.privod.platform.modules.email.repository.EmailAttachmentRepository;
import com.privod.platform.modules.email.repository.EmailMessageRepository;
import com.privod.platform.modules.email.repository.EmailProjectLinkRepository;
import com.privod.platform.modules.email.web.dto.EmailMessageResponse;
import com.privod.platform.infrastructure.security.SecurityUtils;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class EmailMailboxService {

    private final EmailMessageRepository emailMessageRepository;
    private final EmailAttachmentRepository emailAttachmentRepository;
    private final EmailProjectLinkRepository emailProjectLinkRepository;

    @Transactional(readOnly = true)
    public Page<EmailMessageResponse> listMessages(String folder, String search, Pageable pageable) {
        Page<EmailMessage> page;
        if (search != null && !search.isBlank()) {
            page = emailMessageRepository.searchInFolder(folder, search, pageable);
        } else {
            page = emailMessageRepository.findByFolderOrderByReceivedAtDesc(folder, pageable);
        }
        return page.map(EmailMessageResponse::listView);
    }

    @Transactional(readOnly = true)
    public EmailMessageResponse getMessage(UUID id) {
        EmailMessage msg = emailMessageRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Письмо не найдено: " + id));
        return EmailMessageResponse.fromEntity(msg);
    }

    @Transactional
    public void markRead(UUID id) {
        EmailMessage msg = emailMessageRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Письмо не найдено: " + id));
        msg.setRead(true);
        emailMessageRepository.save(msg);
    }

    @Transactional
    public void markUnread(UUID id) {
        EmailMessage msg = emailMessageRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Письмо не найдено: " + id));
        msg.setRead(false);
        emailMessageRepository.save(msg);
    }

    @Transactional
    public void star(UUID id) {
        EmailMessage msg = emailMessageRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Письмо не найдено: " + id));
        msg.setStarred(true);
        emailMessageRepository.save(msg);
    }

    @Transactional
    public void unstar(UUID id) {
        EmailMessage msg = emailMessageRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Письмо не найдено: " + id));
        msg.setStarred(false);
        emailMessageRepository.save(msg);
    }

    @Transactional
    public void deleteMessage(UUID id) {
        EmailMessage msg = emailMessageRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Письмо не найдено: " + id));
        msg.setFolder("Trash");
        emailMessageRepository.save(msg);
    }

    @Transactional
    public void linkProject(UUID emailId, UUID projectId) {
        if (emailProjectLinkRepository.existsByEmailMessageIdAndProjectId(emailId, projectId)) {
            return;
        }
        EmailMessage msg = emailMessageRepository.findById(emailId)
                .orElseThrow(() -> new EntityNotFoundException("Письмо не найдено: " + emailId));

        UUID userId = SecurityUtils.getCurrentUserId().orElse(null);

        EmailProjectLink link = EmailProjectLink.builder()
                .emailMessage(msg)
                .projectId(projectId)
                .linkedBy(userId)
                .build();
        emailProjectLinkRepository.save(link);
    }

    @Transactional
    public void unlinkProject(UUID emailId, UUID projectId) {
        EmailProjectLink link = emailProjectLinkRepository.findByEmailMessageIdAndProjectId(emailId, projectId)
                .orElseThrow(() -> new EntityNotFoundException("Привязка не найдена"));
        emailProjectLinkRepository.delete(link);
    }

    @Transactional(readOnly = true)
    public List<EmailMessageResponse> getProjectMessages(UUID projectId) {
        List<UUID> emailIds = emailProjectLinkRepository.findEmailIdsByProjectId(projectId);
        if (emailIds.isEmpty()) return List.of();
        return emailMessageRepository.findAllById(emailIds).stream()
                .sorted((a, b) -> b.getReceivedAt().compareTo(a.getReceivedAt()))
                .map(EmailMessageResponse::listView)
                .toList();
    }

    @Transactional(readOnly = true)
    public long getUnreadCount() {
        return emailMessageRepository.countUnreadByFolder("INBOX");
    }

    @Transactional(readOnly = true)
    public String getAttachmentPath(UUID emailId, UUID attachmentId) {
        return emailAttachmentRepository.findById(attachmentId)
                .filter(a -> a.getEmailMessage().getId().equals(emailId))
                .map(a -> a.getStoragePath())
                .orElseThrow(() -> new EntityNotFoundException("Вложение не найдено"));
    }
}
