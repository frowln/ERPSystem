package com.privod.platform.modules.email.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.privod.platform.modules.email.config.EmailImapSmtpConfig;
import com.privod.platform.modules.email.domain.EmailAttachment;
import com.privod.platform.modules.email.domain.EmailMessage;
import com.privod.platform.modules.email.repository.EmailAttachmentRepository;
import com.privod.platform.modules.email.repository.EmailMessageRepository;
import jakarta.mail.*;
import jakarta.mail.internet.InternetAddress;
import jakarta.mail.internet.MimeBodyPart;
import jakarta.mail.internet.MimeMessage;
import jakarta.mail.internet.MimeMultipart;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.File;
import java.time.Instant;
import java.util.List;
import java.util.Properties;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class EmailComposeService {

    private final EmailMessageRepository emailMessageRepository;
    private final EmailAttachmentRepository emailAttachmentRepository;
    private final EmailImapSmtpConfig config;
    private final ObjectMapper objectMapper;

    @Transactional
    public EmailMessage sendEmail(List<String> to, List<String> cc, String subject, String bodyHtml) {
        return sendEmailInternal(to, cc, subject, bodyHtml, null, null, List.of());
    }

    @Transactional
    public EmailMessage replyToEmail(UUID originalId, String bodyHtml, boolean replyAll) {
        EmailMessage original = emailMessageRepository.findById(originalId)
                .orElseThrow(() -> new jakarta.persistence.EntityNotFoundException(
                        "Письмо не найдено: " + originalId));

        List<String> to;
        List<String> cc = List.of();

        if (replyAll) {
            to = List.of(original.getFromAddress());
            List<String> originalTo = parseJsonArray(original.getToAddresses());
            List<String> originalCc = parseJsonArray(original.getCcAddresses());
            String myAddress = config.getSmtp().getUsername();
            cc = new java.util.ArrayList<>();
            cc.addAll(originalTo.stream().filter(a -> !a.equalsIgnoreCase(myAddress)).toList());
            cc.addAll(originalCc.stream().filter(a -> !a.equalsIgnoreCase(myAddress)).toList());
        } else {
            to = List.of(original.getFromAddress());
        }

        String replySubject = original.getSubject() != null && !original.getSubject().startsWith("Re: ")
                ? "Re: " + original.getSubject()
                : original.getSubject();

        String inReplyTo = original.getMessageIdHeader();
        String references = original.getReferencesHeader() != null
                ? original.getReferencesHeader() + " " + original.getMessageIdHeader()
                : original.getMessageIdHeader();

        return sendEmailInternal(to, cc, replySubject, bodyHtml, inReplyTo, references, List.of());
    }

    @Transactional
    public EmailMessage forwardEmail(UUID originalId, List<String> to, List<String> cc, String bodyHtml) {
        EmailMessage original = emailMessageRepository.findById(originalId)
                .orElseThrow(() -> new jakarta.persistence.EntityNotFoundException(
                        "Письмо не найдено: " + originalId));

        String fwdSubject = original.getSubject() != null && !original.getSubject().startsWith("Fwd: ")
                ? "Fwd: " + original.getSubject()
                : original.getSubject();

        String fullBody = (bodyHtml != null ? bodyHtml : "")
                + "<br><br>---------- Forwarded message ----------<br>"
                + "<b>From:</b> " + original.getFromAddress() + "<br>"
                + "<b>Date:</b> " + original.getReceivedAt() + "<br>"
                + "<b>Subject:</b> " + original.getSubject() + "<br><br>"
                + (original.getBodyHtml() != null ? original.getBodyHtml() : (original.getBodyText() != null ? original.getBodyText() : ""));

        List<EmailAttachment> originalAttachments = emailAttachmentRepository.findByEmailMessageId(originalId);

        return sendEmailInternal(to, cc != null ? cc : List.of(), fwdSubject, fullBody,
                null, null, originalAttachments);
    }

    private EmailMessage sendEmailInternal(List<String> to, List<String> cc, String subject,
                                           String bodyHtml, String inReplyTo, String references,
                                           List<EmailAttachment> forwardAttachments) {
        var smtpConfig = config.getSmtp();
        Properties props = new Properties();
        props.put("mail.smtp.host", smtpConfig.getHost());
        props.put("mail.smtp.port", String.valueOf(smtpConfig.getPort()));
        props.put("mail.smtp.auth", "true");
        props.put("mail.smtp.ssl.enable", String.valueOf(smtpConfig.isSsl()));
        props.put("mail.smtp.socketFactory.port", String.valueOf(smtpConfig.getPort()));
        props.put("mail.smtp.socketFactory.class", "javax.net.ssl.SSLSocketFactory");
        props.put("mail.smtp.timeout", "30000");
        props.put("mail.smtp.connectiontimeout", "30000");

        Session session = Session.getInstance(props, new Authenticator() {
            @Override
            protected PasswordAuthentication getPasswordAuthentication() {
                return new PasswordAuthentication(smtpConfig.getUsername(), smtpConfig.getPassword());
            }
        });

        try {
            MimeMessage mimeMessage = new MimeMessage(session);
            mimeMessage.setFrom(new InternetAddress(smtpConfig.getUsername()));

            for (String addr : to) {
                mimeMessage.addRecipient(Message.RecipientType.TO, new InternetAddress(addr.trim()));
            }
            if (cc != null) {
                for (String addr : cc) {
                    mimeMessage.addRecipient(Message.RecipientType.CC, new InternetAddress(addr.trim()));
                }
            }

            mimeMessage.setSubject(subject, "UTF-8");

            if (inReplyTo != null) {
                mimeMessage.setHeader("In-Reply-To", inReplyTo);
            }
            if (references != null) {
                mimeMessage.setHeader("References", references);
            }

            if (forwardAttachments != null && !forwardAttachments.isEmpty()) {
                MimeMultipart multipart = new MimeMultipart();

                MimeBodyPart htmlPart = new MimeBodyPart();
                htmlPart.setContent(bodyHtml, "text/html; charset=UTF-8");
                multipart.addBodyPart(htmlPart);

                for (EmailAttachment att : forwardAttachments) {
                    if (att.getStoragePath() != null) {
                        File file = new File(att.getStoragePath());
                        if (file.exists()) {
                            MimeBodyPart attachmentPart = new MimeBodyPart();
                            attachmentPart.attachFile(file);
                            attachmentPart.setFileName(att.getFileName());
                            multipart.addBodyPart(attachmentPart);
                        }
                    }
                }

                mimeMessage.setContent(multipart);
            } else {
                mimeMessage.setContent(bodyHtml, "text/html; charset=UTF-8");
            }

            Transport.send(mimeMessage);
            log.info("Email sent to: {}, subject: {}", to, subject);

            EmailMessage saved = EmailMessage.builder()
                    .messageUid("sent-" + UUID.randomUUID())
                    .messageIdHeader(mimeMessage.getMessageID())
                    .folder("Sent")
                    .fromAddress(smtpConfig.getUsername())
                    .toAddresses(toJsonArray(to))
                    .ccAddresses(cc != null ? toJsonArray(cc) : "[]")
                    .subject(subject)
                    .bodyHtml(bodyHtml)
                    .receivedAt(Instant.now())
                    .isRead(true)
                    .inReplyTo(inReplyTo)
                    .referencesHeader(references)
                    .build();

            return emailMessageRepository.save(saved);

        } catch (Exception e) {
            log.error("Failed to send email to {}: {}", to, e.getMessage(), e);
            throw new RuntimeException("Ошибка отправки письма: " + e.getMessage(), e);
        }
    }

    private String toJsonArray(List<String> list) {
        if (list == null || list.isEmpty()) return "[]";
        try {
            return objectMapper.writeValueAsString(list);
        } catch (JsonProcessingException e) {
            return "[]";
        }
    }

    private List<String> parseJsonArray(String json) {
        if (json == null || json.isBlank()) return List.of();
        String cleaned = json.replaceAll("[\\[\\]\"]", "");
        if (cleaned.isBlank()) return List.of();
        return List.of(cleaned.split(",")).stream().map(String::trim).filter(s -> !s.isEmpty()).toList();
    }
}
