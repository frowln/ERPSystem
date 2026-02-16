package com.privod.platform.modules.messaging.service;

import com.privod.platform.infrastructure.audit.AuditService;
import com.privod.platform.infrastructure.security.CustomUserDetails;
import com.privod.platform.modules.auth.domain.User;
import com.privod.platform.modules.auth.repository.UserRepository;
import com.privod.platform.modules.messaging.domain.AvailabilityStatus;
import com.privod.platform.modules.messaging.domain.Channel;
import com.privod.platform.modules.messaging.domain.ChannelMember;
import com.privod.platform.modules.messaging.domain.ChannelMemberRole;
import com.privod.platform.modules.messaging.domain.Message;
import com.privod.platform.modules.messaging.domain.MessageFavorite;
import com.privod.platform.modules.messaging.domain.MessageReaction;
import com.privod.platform.modules.messaging.domain.MessageType;
import com.privod.platform.modules.messaging.domain.UserStatus;
import com.privod.platform.modules.messaging.repository.ChannelMemberRepository;
import com.privod.platform.modules.messaging.repository.ChannelRepository;
import com.privod.platform.modules.messaging.repository.MessageFavoriteRepository;
import com.privod.platform.modules.messaging.repository.MessageReactionRepository;
import com.privod.platform.modules.messaging.repository.MessageRepository;
import com.privod.platform.modules.messaging.repository.UserStatusRepository;
import com.privod.platform.modules.messaging.web.dto.ChannelResponse;
import com.privod.platform.modules.messaging.web.dto.CreateChannelRequest;
import com.privod.platform.modules.messaging.web.dto.EditMessageRequest;
import com.privod.platform.modules.messaging.web.dto.FavoriteResponse;
import com.privod.platform.modules.messaging.web.dto.MessageResponse;
import com.privod.platform.modules.messaging.web.dto.ReactionResponse;
import com.privod.platform.modules.messaging.web.dto.SendMessageRequest;
import com.privod.platform.modules.messaging.web.dto.SetUserStatusRequest;
import com.privod.platform.modules.messaging.web.dto.UserStatusResponse;
import com.privod.platform.modules.project.domain.Project;
import com.privod.platform.modules.project.repository.ProjectRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class MessagingService {

    private final ChannelRepository channelRepository;
    private final ChannelMemberRepository channelMemberRepository;
    private final MessageRepository messageRepository;
    private final MessageReactionRepository messageReactionRepository;
    private final MessageFavoriteRepository messageFavoriteRepository;
    private final UserStatusRepository userStatusRepository;
    private final UserRepository userRepository;
    private final AuditService auditService;
    private final ProjectRepository projectRepository;

    @Transactional(readOnly = true)
    public List<ChannelResponse> getMyChannels() {
        User current = getCurrentUserEntity();
        return channelRepository.findMyChannels(
                        current.getId(),
                        PageRequest.of(0, 100, Sort.by(Sort.Direction.DESC, "lastMessageAt"))
                )
                .map(ChannelResponse::fromEntity)
                .getContent();
    }

    @Transactional
    public ChannelResponse createChannel(CreateChannelRequest request) {
        User current = getCurrentUserEntity();
        UUID organizationId = current.getOrganizationId();
        if (organizationId == null) {
            throw new IllegalStateException("Организация пользователя не определена");
        }

        if (request.projectId() != null) {
            UUID projectId = request.projectId();
            Project project = projectRepository.findById(projectId)
                    .filter(p -> !p.isDeleted())
                    .orElseThrow(() -> new EntityNotFoundException("Проект не найден: " + projectId));
            if (project.getOrganizationId() == null || !organizationId.equals(project.getOrganizationId())) {
                // Do not leak existence of other-tenant projects
                throw new EntityNotFoundException("Проект не найден: " + projectId);
            }
        }

        String code = "CH-" + String.format("%05d", channelRepository.getNextCodeSequence());
        Channel channel = Channel.builder()
                .code(code)
                .name(request.name())
                .description(request.description())
                .channelType(request.channelType())
                .avatarUrl(request.avatarUrl())
                .creatorId(current.getId())
                .projectId(request.projectId())
                .memberCount(0)
                .build();
        channel = channelRepository.save(channel);

        ChannelMember owner = ChannelMember.builder()
                .channelId(channel.getId())
                .userId(current.getId())
                .userName(current.getFullName())
                .role(ChannelMemberRole.OWNER)
                .joinedAt(Instant.now())
                .build();
        channelMemberRepository.save(owner);
        channel.incrementMemberCount();

        if (request.memberIds() != null) {
            for (UUID memberId : request.memberIds()) {
                if (memberId == null || memberId.equals(current.getId())) {
                    continue;
                }
                User user = userRepository.findById(memberId)
                        .filter(u -> !u.isDeleted())
                        .orElseThrow(() -> new EntityNotFoundException("Пользователь не найден: " + memberId));
                if (user.getOrganizationId() == null || !organizationId.equals(user.getOrganizationId())) {
                    throw new IllegalStateException("Нельзя добавить пользователя из другой организации");
                }
                ChannelMember cm = ChannelMember.builder()
                        .channelId(channel.getId())
                        .userId(memberId)
                        .userName(user.getFullName())
                        .role(ChannelMemberRole.MEMBER)
                        .joinedAt(Instant.now())
                        .build();
                channelMemberRepository.save(cm);
                channel.incrementMemberCount();
            }
        }
        channelRepository.save(channel);
        auditService.logCreate("Channel", channel.getId());
        return ChannelResponse.fromEntity(channel);
    }

    @Transactional(readOnly = true)
    public List<MessageResponse> getChannelMessages(UUID channelId) {
        User current = getCurrentUserEntity();
        if (!channelMemberRepository.existsByChannelIdAndUserId(channelId, current.getId())) {
            throw new IllegalStateException("Доступ к каналу запрещен");
        }
        return messageRepository.findByChannelId(
                        channelId,
                        PageRequest.of(0, 200, Sort.by(Sort.Direction.DESC, "createdAt"))
                )
                .map(MessageResponse::fromEntity)
                .getContent();
    }

    @Transactional
    public MessageResponse sendMessage(UUID channelId, SendMessageRequest request) {
        User current = getCurrentUserEntity();
        if (!channelMemberRepository.existsByChannelIdAndUserId(channelId, current.getId())) {
            throw new IllegalStateException("Доступ к каналу запрещен");
        }
        Message message = Message.builder()
                .channelId(channelId)
                .authorId(current.getId())
                .authorName(current.getFullName())
                .authorAvatarUrl(current.getAvatarUrl())
                .content(request.content())
                .messageType(request.messageType() != null ? request.messageType() : MessageType.TEXT)
                .parentMessageId(request.parentMessageId())
                .attachmentUrl(request.attachmentUrl())
                .attachmentName(request.attachmentName())
                .attachmentSize(request.attachmentSize())
                .attachmentType(request.attachmentType())
                .build();
        message = messageRepository.save(message);

        Channel channel = channelRepository.findById(channelId)
                .orElseThrow(() -> new EntityNotFoundException("Канал не найден: " + channelId));
        channel.setLastMessageAt(Instant.now());
        channelRepository.save(channel);

        auditService.logCreate("Message", message.getId());
        return MessageResponse.fromEntity(message);
    }

    @Transactional
    public MessageResponse editMessage(UUID messageId, EditMessageRequest request) {
        User current = getCurrentUserEntity();
        Message message = messageRepository.findById(messageId)
                .orElseThrow(() -> new EntityNotFoundException("Сообщение не найдено: " + messageId));
        if (message.isDeleted()) {
            throw new EntityNotFoundException("Сообщение удалено");
        }
        if (!current.getId().equals(message.getAuthorId())) {
            throw new IllegalStateException("Редактировать можно только свои сообщения");
        }
        message.setContent(request.content());
        message.setIsEdited(true);
        message.setEditedAt(Instant.now());
        message = messageRepository.save(message);
        auditService.logUpdate("Message", messageId, "content", null, request.content());
        return MessageResponse.fromEntity(message);
    }

    @Transactional
    public ReactionResponse addReaction(UUID messageId, String emoji) {
        User current = getCurrentUserEntity();
        Message message = messageRepository.findById(messageId)
                .orElseThrow(() -> new EntityNotFoundException("Сообщение не найдено: " + messageId));
        if (messageReactionRepository.existsByMessageIdAndUserIdAndEmoji(messageId, current.getId(), emoji)) {
            MessageReaction existing = messageReactionRepository
                    .findByMessageIdAndUserIdAndEmoji(messageId, current.getId(), emoji)
                    .orElseThrow();
            return ReactionResponse.fromEntity(existing);
        }
        MessageReaction reaction = MessageReaction.builder()
                .messageId(messageId)
                .userId(current.getId())
                .userName(current.getFullName())
                .emoji(emoji)
                .build();
        reaction = messageReactionRepository.save(reaction);
        message.incrementReactionCount();
        messageRepository.save(message);
        auditService.logCreate("MessageReaction", reaction.getId());
        return ReactionResponse.fromEntity(reaction);
    }

    @Transactional
    public void removeReaction(UUID messageId, String emoji) {
        User current = getCurrentUserEntity();
        MessageReaction reaction = messageReactionRepository
                .findByMessageIdAndUserIdAndEmoji(messageId, current.getId(), emoji)
                .orElseThrow(() -> new EntityNotFoundException("Реакция не найдена"));
        reaction.softDelete();
        messageReactionRepository.save(reaction);
        Message message = messageRepository.findById(messageId).orElseThrow();
        message.decrementReactionCount();
        messageRepository.save(message);
    }

    @Transactional
    public void pinMessage(UUID messageId) {
        Message message = messageRepository.findById(messageId)
                .orElseThrow(() -> new EntityNotFoundException("Сообщение не найдено"));
        User current = getCurrentUserEntity();
        message.setIsPinned(true);
        message.setPinnedBy(current.getId());
        message.setPinnedAt(Instant.now());
        messageRepository.save(message);
    }

    @Transactional
    public FavoriteResponse addFavorite(UUID messageId, String note) {
        User current = getCurrentUserEntity();
        Message message = messageRepository.findById(messageId)
                .orElseThrow(() -> new EntityNotFoundException("Сообщение не найдено"));
        MessageFavorite favorite = messageFavoriteRepository
                .findByMessageIdAndUserId(messageId, current.getId())
                .orElseGet(() -> MessageFavorite.builder()
                        .messageId(messageId)
                        .userId(current.getId())
                        .build());
        favorite.setNote(note);
        favorite = messageFavoriteRepository.save(favorite);
        auditService.logCreate("MessageFavorite", favorite.getId());
        String channelName = channelRepository.findById(message.getChannelId())
                .map(Channel::getName)
                .orElse("unknown");
        return FavoriteResponse.fromEntity(
                favorite,
                channelName,
                MessageResponse.fromEntity(message)
        );
    }

    @Transactional
    public void removeFavorite(UUID messageId) {
        User current = getCurrentUserEntity();
        MessageFavorite favorite = messageFavoriteRepository
                .findByMessageIdAndUserId(messageId, current.getId())
                .orElseThrow(() -> new EntityNotFoundException("Избранное не найдено"));
        favorite.softDelete();
        messageFavoriteRepository.save(favorite);
    }

    @Transactional(readOnly = true)
    public List<FavoriteResponse> getMyFavorites() {
        User current = getCurrentUserEntity();
        List<FavoriteResponse> favorites = messageFavoriteRepository.findByUserId(
                        current.getId(),
                        PageRequest.of(0, 200, Sort.by(Sort.Direction.DESC, "createdAt"))
                )
                .map(favorite -> {
                    Message message = messageRepository.findById(favorite.getMessageId()).orElse(null);
                    if (message == null || message.isDeleted()) {
                        return null;
                    }
                    String channelName = channelRepository.findById(message.getChannelId())
                            .map(Channel::getName)
                            .orElse("unknown");
                    return FavoriteResponse.fromEntity(
                            favorite,
                            channelName,
                            MessageResponse.fromEntity(message)
                    );
                })
                .getContent();
        return favorites.stream().filter(f -> f != null).toList();
    }

    @Transactional(readOnly = true)
    public List<MessageResponse> searchMessages(String q) {
        User current = getCurrentUserEntity();
        if (q == null || q.isBlank()) {
            return List.of();
        }
        return messageRepository.searchGlobal(
                        current.getId(),
                        q,
                        PageRequest.of(0, 200, Sort.by(Sort.Direction.DESC, "createdAt"))
                )
                .map(MessageResponse::fromEntity)
                .getContent();
    }

    @Transactional(readOnly = true)
    public UserStatusResponse getUserStatus(UUID userId) {
        User current = getCurrentUserEntity();
        UUID organizationId = current.getOrganizationId();
        if (organizationId == null) {
            throw new IllegalStateException("Организация пользователя не определена");
        }

        User target = userRepository.findById(userId)
                .filter(u -> !u.isDeleted())
                .orElseThrow(() -> new EntityNotFoundException("Пользователь не найден: " + userId));
        if (target.getOrganizationId() == null || !organizationId.equals(target.getOrganizationId())) {
            // Do not leak existence of users from other tenants
            throw new EntityNotFoundException("Пользователь не найден: " + userId);
        }

        UserStatus status = userStatusRepository.findByUserId(userId)
                .orElseGet(() -> {
                    UserStatus created = UserStatus.builder()
                            .userId(userId)
                            .availabilityStatus(AvailabilityStatus.OFFLINE)
                            .isOnline(false)
                            .lastSeenAt(Instant.now())
                            .build();
                    return userStatusRepository.save(created);
                });
        return UserStatusResponse.fromEntity(status);
    }

    @Transactional
    public UserStatusResponse setMyStatus(SetUserStatusRequest request) {
        User current = getCurrentUserEntity();
        UserStatus status = userStatusRepository.findByUserId(current.getId())
                .orElseGet(() -> UserStatus.builder().userId(current.getId()).build());

        status.setStatusText(request.statusText());
        status.setStatusEmoji(request.statusEmoji());
        if (request.availabilityStatus() != null) {
            status.setAvailabilityStatus(request.availabilityStatus());
            status.setIsOnline(request.availabilityStatus() != AvailabilityStatus.OFFLINE);
        }
        status.setLastSeenAt(Instant.now());
        status = userStatusRepository.save(status);
        return UserStatusResponse.fromEntity(status);
    }

    private User getCurrentUserEntity() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated()) {
            throw new IllegalStateException("Пользователь не аутентифицирован");
        }
        String email;
        if (authentication.getPrincipal() instanceof CustomUserDetails customUserDetails) {
            email = customUserDetails.getEmail();
        } else {
            email = authentication.getName();
        }
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new EntityNotFoundException("Пользователь не найден: " + email));
    }
}
