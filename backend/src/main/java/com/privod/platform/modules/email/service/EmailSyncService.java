package com.privod.platform.modules.email.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.privod.platform.modules.email.config.EmailImapSmtpConfig;
import com.privod.platform.modules.email.domain.EmailAttachment;
import com.privod.platform.modules.email.domain.EmailMessage;
import com.privod.platform.modules.email.repository.EmailMessageRepository;
import jakarta.mail.*;
import jakarta.mail.internet.InternetAddress;
import jakarta.mail.internet.MimeMessage;
import jakarta.mail.internet.MimeMultipart;
import jakarta.persistence.EntityManager;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.support.TransactionTemplate;

import org.springframework.dao.DataIntegrityViolationException;

import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.time.Instant;
import java.util.*;
import java.util.concurrent.atomic.AtomicBoolean;

@Service
@RequiredArgsConstructor
@Slf4j
public class EmailSyncService {

    private final EmailMessageRepository emailMessageRepository;
    private final EmailImapSmtpConfig config;
    private final ObjectMapper objectMapper;
    private final EntityManager entityManager;
    private final TransactionTemplate transactionTemplate;

    private static final String ATTACHMENTS_DIR = "data/email-attachments";
    private final AtomicBoolean syncing = new AtomicBoolean(false);

    @Scheduled(fixedDelayString = "${app.email.yandex.imap.sync-interval-ms:120000}",
            initialDelayString = "${app.email.yandex.imap.sync-interval-ms:120000}")
    public void scheduledSync() {
        if (!isConfigured()) return;
        syncAllFolders();
    }

    private boolean isConfigured() {
        String password = config.getImap().getPassword();
        return password != null && !password.isBlank();
    }

    /**
     * Full sync: loads ALL messages from the server, not just recent ones.
     */
    public int syncAllFoldersFull() {
        if (!isConfigured()) return 0;
        if (!syncing.compareAndSet(false, true)) {
            log.info("Email sync already in progress — skipping full sync");
            return 0;
        }
        try {
            int total = 0;
            try {
                total += syncFolderFull("INBOX");
            } catch (Exception e) {
                log.error("Error full-syncing INBOX: {}", e.getMessage());
            }
            try {
                total += syncFolderFull("Sent");
            } catch (Exception e) {
                log.error("Error full-syncing Sent: {}", e.getMessage());
            }
            log.info("Full email sync completed: {} new messages", total);
            return total;
        } finally {
            syncing.set(false);
        }
    }

    private int syncFolderFull(String folderName) {
        var imapConfig = config.getImap();
        Properties props = new Properties();
        props.put("mail.store.protocol", "imaps");
        props.put("mail.imaps.host", imapConfig.getHost());
        props.put("mail.imaps.port", String.valueOf(imapConfig.getPort()));
        props.put("mail.imaps.ssl.enable", String.valueOf(imapConfig.isSsl()));
        props.put("mail.imaps.timeout", "60000");
        props.put("mail.imaps.connectiontimeout", "30000");

        Session session = Session.getInstance(props);
        int synced = 0;
        int batchSize = imapConfig.getInitialFetch();

        try (Store store = session.getStore("imaps")) {
            store.connect(imapConfig.getHost(), imapConfig.getUsername(), imapConfig.getPassword());
            String imapFolder = mapFolderName(folderName);
            try (Folder folder = store.getFolder(imapFolder)) {
                folder.open(Folder.READ_ONLY);
                int messageCount = folder.getMessageCount();
                if (messageCount == 0) return 0;

                log.info("Full sync for {}: {} messages on server", folderName, messageCount);
                int end = messageCount;
                while (end >= 1) {
                    int start = Math.max(1, end - batchSize + 1);
                    synced += syncBatch(folder, folderName, start, end);
                    log.info("Full sync batch {}: {}-{}, synced total: {}", folderName, start, end, synced);
                    end = start - 1;
                }
            }
        } catch (Exception e) {
            log.error("Error in full sync folder {}: {}", folderName, e.getMessage(), e);
        }
        log.info("Full sync completed {} new messages from {}", synced, folderName);
        return synced;
    }

    public int syncAllFolders() {
        if (!isConfigured()) {
            log.debug("Email IMAP not configured — skipping sync");
            return 0;
        }
        if (!syncing.compareAndSet(false, true)) {
            log.info("Email sync already in progress — skipping");
            return 0;
        }
        try {
            int total = 0;
            try {
                total += syncFolder("INBOX");
            } catch (Exception e) {
                log.error("Error syncing INBOX: {}", e.getMessage());
            }
            try {
                total += syncFolder("Sent");
            } catch (Exception e) {
                log.error("Error syncing Sent: {}", e.getMessage());
            }
            log.info("Email sync completed: {} new messages", total);
            return total;
        } finally {
            syncing.set(false);
        }
    }

    public int syncFolder(String folderName) {
        var imapConfig = config.getImap();
        Properties props = new Properties();
        props.put("mail.store.protocol", "imaps");
        props.put("mail.imaps.host", imapConfig.getHost());
        props.put("mail.imaps.port", String.valueOf(imapConfig.getPort()));
        props.put("mail.imaps.ssl.enable", String.valueOf(imapConfig.isSsl()));
        props.put("mail.imaps.timeout", "60000");
        props.put("mail.imaps.connectiontimeout", "30000");

        Session session = Session.getInstance(props);
        int synced = 0;

        try (Store store = session.getStore("imaps")) {
            store.connect(imapConfig.getHost(), imapConfig.getUsername(), imapConfig.getPassword());

            String imapFolder = mapFolderName(folderName);
            try (Folder folder = store.getFolder(imapFolder)) {
                folder.open(Folder.READ_ONLY);

                int messageCount = folder.getMessageCount();
                if (messageCount == 0) {
                    log.debug("Folder {} is empty", folderName);
                    return 0;
                }

                long existingCount = emailMessageRepository.countByFolder(folderName);
                int batchSize = imapConfig.getInitialFetch(); // 200

                if (existingCount == 0) {
                    // Initial sync: load ALL messages in batches from newest to oldest
                    log.info("Initial sync for {}: {} messages on server, loading in batches of {}", folderName, messageCount, batchSize);
                    int end = messageCount;
                    while (end >= 1) {
                        int start = Math.max(1, end - batchSize + 1);
                        synced += syncBatch(folder, folderName, start, end);
                        log.info("Batch synced {}: messages {}-{}, total synced so far: {}", folderName, start, end, synced);
                        end = start - 1;
                    }
                } else {
                    // Incremental sync: load latest messages that we don't have yet
                    int fetchCount = Math.min(imapConfig.getMaxFetch(), messageCount);
                    int start = Math.max(1, messageCount - fetchCount + 1);
                    synced = syncBatch(folder, folderName, start, messageCount);
                }
            }
        } catch (Exception e) {
            log.error("Error syncing folder {}: {}", folderName, e.getMessage(), e);
        }

        log.info("Synced {} new messages from {}", synced, folderName);
        return synced;
    }

    private int syncBatch(Folder folder, String folderName, int start, int end) throws MessagingException {
        Message[] messages = folder.getMessages(start, end);

        FetchProfile fp = new FetchProfile();
        fp.add(FetchProfile.Item.ENVELOPE);
        fp.add(FetchProfile.Item.FLAGS);
        fp.add(UIDFolder.FetchProfileItem.UID);
        folder.fetch(messages, fp);

        int synced = 0;
        for (Message message : messages) {
            try {
                String uid = getMessageUid(folder, message);
                if (emailMessageRepository.existsByMessageUidAndFolder(uid, folderName)) {
                    continue;
                }
                Boolean saved = transactionTemplate.execute(status -> {
                    try {
                        return parseAndSaveMessage(message, uid, folderName) != null;
                    } catch (Exception ex) {
                        status.setRollbackOnly();
                        return false;
                    }
                });
                if (Boolean.TRUE.equals(saved)) synced++;
            } catch (DataIntegrityViolationException e) {
                log.debug("Duplicate message skipped in {}", folderName);
            } catch (Exception e) {
                log.warn("Error processing message in {}: {}", folderName, e.getMessage());
            }
        }
        return synced;
    }

    private EmailMessage parseAndSaveMessage(Message message, String uid, String folderName) throws Exception {
        MimeMessage mime = (MimeMessage) message;

        String fromAddress = "";
        String fromName = null;
        Address[] fromAddresses = mime.getFrom();
        if (fromAddresses != null && fromAddresses.length > 0) {
            if (fromAddresses[0] instanceof InternetAddress ia) {
                fromAddress = ia.getAddress();
                fromName = ia.getPersonal();
            } else {
                fromAddress = fromAddresses[0].toString();
            }
        }

        List<String> toList = extractAddresses(mime.getRecipients(Message.RecipientType.TO));
        List<String> ccList = extractAddresses(mime.getRecipients(Message.RecipientType.CC));
        List<String> bccList = extractAddresses(mime.getRecipients(Message.RecipientType.BCC));

        String[] messageIdHeaders = mime.getHeader("Message-ID");
        String messageIdHeader = messageIdHeaders != null && messageIdHeaders.length > 0
                ? messageIdHeaders[0] : null;

        String[] inReplyToHeaders = mime.getHeader("In-Reply-To");
        String inReplyTo = inReplyToHeaders != null && inReplyToHeaders.length > 0
                ? inReplyToHeaders[0] : null;

        String[] referencesHeaders = mime.getHeader("References");
        String references = referencesHeaders != null && referencesHeaders.length > 0
                ? referencesHeaders[0] : null;

        Instant receivedAt = mime.getReceivedDate() != null
                ? mime.getReceivedDate().toInstant()
                : (mime.getSentDate() != null ? mime.getSentDate().toInstant() : Instant.now());

        Map<String, Object> bodyResult = extractBody(mime);
        String bodyText = (String) bodyResult.get("text");
        String bodyHtml = (String) bodyResult.get("html");
        @SuppressWarnings("unchecked")
        List<Map<String, Object>> attachmentInfos = (List<Map<String, Object>>) bodyResult.get("attachments");

        boolean hasAttachments = attachmentInfos != null && !attachmentInfos.isEmpty();

        EmailMessage emailMessage = EmailMessage.builder()
                .messageUid(uid)
                .messageIdHeader(messageIdHeader)
                .folder(folderName)
                .fromAddress(fromAddress)
                .fromName(fromName)
                .toAddresses(toJsonArray(toList))
                .ccAddresses(toJsonArray(ccList))
                .bccAddresses(toJsonArray(bccList))
                .subject(mime.getSubject())
                .bodyText(bodyText)
                .bodyHtml(bodyHtml)
                .receivedAt(receivedAt)
                .isRead(mime.isSet(Flags.Flag.SEEN))
                .hasAttachments(hasAttachments)
                .inReplyTo(inReplyTo)
                .referencesHeader(references)
                .build();

        emailMessage = emailMessageRepository.save(emailMessage);

        if (hasAttachments) {
            saveAttachments(emailMessage, attachmentInfos);
            emailMessageRepository.save(emailMessage);
        }

        return emailMessage;
    }

    private void saveAttachments(EmailMessage emailMessage, List<Map<String, Object>> attachmentInfos) {
        for (Map<String, Object> attInfo : attachmentInfos) {
            String fileName = (String) attInfo.get("fileName");
            String contentType = (String) attInfo.get("contentType");
            byte[] data = (byte[]) attInfo.get("data");

            if (fileName == null || data == null) continue;

            try {
                Path dir = Path.of(ATTACHMENTS_DIR, emailMessage.getId().toString());
                Files.createDirectories(dir);
                Path filePath = dir.resolve(fileName);
                Files.write(filePath, data);

                EmailAttachment attachment = EmailAttachment.builder()
                        .emailMessage(emailMessage)
                        .fileName(fileName)
                        .contentType(contentType)
                        .sizeBytes((long) data.length)
                        .storagePath(filePath.toString())
                        .build();

                emailMessage.getAttachments().add(attachment);
            } catch (IOException e) {
                log.warn("Failed to save attachment {} for email {}: {}", fileName, emailMessage.getId(), e.getMessage());
            }
        }
    }

    private Map<String, Object> extractBody(Part part) throws Exception {
        Map<String, Object> result = new HashMap<>();
        result.put("text", null);
        result.put("html", null);
        result.put("attachments", new ArrayList<Map<String, Object>>());

        extractBodyRecursive(part, result);
        return result;
    }

    @SuppressWarnings("unchecked")
    private void extractBodyRecursive(Part part, Map<String, Object> result) throws Exception {
        String contentType = part.getContentType();

        if (part.isMimeType("text/plain") && result.get("text") == null && !Part.ATTACHMENT.equalsIgnoreCase(part.getDisposition())) {
            result.put("text", part.getContent().toString());
        } else if (part.isMimeType("text/html") && result.get("html") == null && !Part.ATTACHMENT.equalsIgnoreCase(part.getDisposition())) {
            result.put("html", part.getContent().toString());
        } else if (part.isMimeType("multipart/*")) {
            MimeMultipart multipart = (MimeMultipart) part.getContent();
            for (int i = 0; i < multipart.getCount(); i++) {
                extractBodyRecursive(multipart.getBodyPart(i), result);
            }
        } else if (Part.ATTACHMENT.equalsIgnoreCase(part.getDisposition()) || part.getFileName() != null) {
            String fileName = part.getFileName();
            if (fileName != null) {
                try {
                    fileName = jakarta.mail.internet.MimeUtility.decodeText(fileName);
                } catch (Exception ignored) {}
            }
            List<Map<String, Object>> atts = (List<Map<String, Object>>) result.get("attachments");
            try (InputStream is = part.getInputStream()) {
                byte[] data = is.readAllBytes();
                Map<String, Object> attInfo = new HashMap<>();
                attInfo.put("fileName", fileName);
                // Truncate content type to base MIME type (strip parameters like charset, name, etc.)
                String cleanContentType = contentType;
                if (cleanContentType != null) {
                    int semicolonIdx = cleanContentType.indexOf(';');
                    if (semicolonIdx > 0) {
                        cleanContentType = cleanContentType.substring(0, semicolonIdx).trim();
                    }
                    if (cleanContentType.length() > 200) {
                        cleanContentType = cleanContentType.substring(0, 200);
                    }
                }
                attInfo.put("contentType", cleanContentType);
                attInfo.put("data", data);
                atts.add(attInfo);
            }
        }
    }

    private String getMessageUid(Folder folder, Message message) throws MessagingException {
        if (folder instanceof UIDFolder uidFolder) {
            return String.valueOf(uidFolder.getUID(message));
        }
        return String.valueOf(message.getMessageNumber());
    }

    private List<String> extractAddresses(Address[] addresses) {
        if (addresses == null) return List.of();
        return Arrays.stream(addresses)
                .map(a -> a instanceof InternetAddress ia ? ia.getAddress() : a.toString())
                .toList();
    }

    private String toJsonArray(List<String> list) {
        if (list == null || list.isEmpty()) return "[]";
        try {
            return objectMapper.writeValueAsString(list);
        } catch (JsonProcessingException e) {
            return "[]";
        }
    }

    private String mapFolderName(String folderName) {
        return switch (folderName) {
            case "Sent" -> "Sent";
            case "Drafts" -> "Drafts";
            case "Trash" -> "Trash";
            case "Spam" -> "Spam";
            default -> "INBOX";
        };
    }
}
