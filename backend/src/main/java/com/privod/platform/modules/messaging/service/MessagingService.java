package com.privod.platform.modules.messaging.service;

import com.privod.platform.infrastructure.audit.AuditService;
import com.privod.platform.infrastructure.security.CustomUserDetails;
import com.privod.platform.modules.auth.domain.User;
import com.privod.platform.modules.auth.repository.UserRepository;
import com.privod.platform.modules.messaging.domain.AvailabilityStatus;
import com.privod.platform.modules.messaging.domain.Channel;
import com.privod.platform.modules.messaging.domain.ChannelMember;
import com.privod.platform.modules.messaging.domain.ChannelMemberRole;
import com.privod.platform.modules.messaging.domain.ChannelType;
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
import com.privod.platform.modules.messaging.web.dto.ChannelMemberResponse;
import com.privod.platform.modules.messaging.web.dto.ChannelResponse;
import com.privod.platform.modules.messaging.web.dto.CreateChannelRequest;
import com.privod.platform.modules.messaging.web.dto.EditMessageRequest;
import com.privod.platform.modules.messaging.web.dto.FavoriteResponse;
import com.privod.platform.modules.messaging.web.dto.MessageReactionInfo;
import com.privod.platform.modules.messaging.web.dto.MessageResponse;
import com.privod.platform.modules.messaging.web.dto.OrgUserResponse;
import com.privod.platform.modules.messaging.web.dto.ReactionResponse;
import com.privod.platform.modules.messaging.web.dto.SendMessageRequest;
import com.privod.platform.modules.messaging.web.dto.SetUserStatusRequest;
import com.privod.platform.modules.messaging.web.dto.UserStatusResponse;
import com.privod.platform.modules.project.domain.Project;
import com.privod.platform.modules.project.repository.ProjectRepository;
import com.privod.platform.modules.notification.domain.NotificationType;
import com.privod.platform.modules.notification.service.NotificationService;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
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
    private final NotificationService notificationService;
    private final SimpMessagingTemplate simpMessagingTemplate;

    @Transactional(readOnly = true)
    public List<ChannelResponse> getMyChannels() {
        User current = getCurrentUserEntity();
        UUID currentUserId = current.getId();
        List<Channel> channels = channelRepository.findMyChannels(
                        currentUserId,
                        PageRequest.of(0, 100, Sort.by(Sort.Direction.DESC, "lastMessageAt"))
                )
                .getContent();

        return channels.stream().map(channel -> {
            if (channel.getChannelType() == ChannelType.DIRECT) {
                return enrichDmChannel(channel, currentUserId);
            }
            return ChannelResponse.fromEntity(channel);
        }).toList();
    }

    private ChannelResponse enrichDmChannel(Channel channel, UUID currentUserId) {
        List<ChannelMember> members = channelMemberRepository.findByChannelId(channel.getId());
        ChannelMember other = members.stream()
                .filter(m -> !m.getUserId().equals(currentUserId))
                .findFirst()
                .orElse(null);
        if (other != null) {
            User otherUser = userRepository.findById(other.getUserId())
                    .filter(u -> !u.isDeleted())
                    .orElse(null);
            String otherName = otherUser != null ? otherUser.getFullName() : other.getUserName();
            String otherAvatar = otherUser != null ? otherUser.getAvatarUrl() : null;
            String otherStatus = userStatusRepository.findByUserId(other.getUserId())
                    .map(us -> us.getAvailabilityStatus().name())
                    .orElse("OFFLINE");
            return ChannelResponse.fromEntityWithDm(channel, other.getUserId(), otherName, otherAvatar, otherStatus);
        }
        return ChannelResponse.fromEntity(channel);
    }

    @Transactional
    public ChannelResponse createChannel(CreateChannelRequest request) {
        User current = getCurrentUserEntity();
        UUID organizationId = current.getOrganizationId();
        if (organizationId == null) {
            throw new IllegalStateException("Организация пользователя не определена");
        }

        // For DIRECT channels, check if DM already exists
        if (request.channelType() == ChannelType.DIRECT && request.memberIds() != null && !request.memberIds().isEmpty()) {
            UUID targetId = request.memberIds().get(0);
            List<Channel> existing = channelRepository.findDirectChannelBetween(current.getId(), targetId);
            if (!existing.isEmpty()) {
                return enrichDmChannel(existing.get(0), current.getId());
            }
        }

        if (request.projectId() != null) {
            UUID projectId = request.projectId();
            Project project = projectRepository.findById(projectId)
                    .filter(p -> !p.isDeleted())
                    .orElseThrow(() -> new EntityNotFoundException("Проект не найден: " + projectId));
            if (project.getOrganizationId() == null || !organizationId.equals(project.getOrganizationId())) {
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
        channel = channelRepository.save(channel);
        auditService.logCreate("Channel", channel.getId());

        if (channel.getChannelType() == ChannelType.DIRECT) {
            return enrichDmChannel(channel, current.getId());
        }
        return ChannelResponse.fromEntity(channel);
    }

    @Transactional(readOnly = true)
    public List<MessageResponse> getChannelMessages(UUID channelId) {
        User current = getCurrentUserEntity();
        if (!channelMemberRepository.existsByChannelIdAndUserId(channelId, current.getId())) {
            throw new IllegalStateException("Доступ к каналу запрещен");
        }
        List<Message> messages = messageRepository.findByChannelId(
                        channelId,
                        PageRequest.of(0, 200, Sort.by(Sort.Direction.DESC, "createdAt"))
                )
                .getContent();

        List<UUID> messageIds = messages.stream().map(Message::getId).toList();
        Map<UUID, List<MessageReaction>> reactionsByMessage = messageIds.isEmpty()
                ? Map.of()
                : messageReactionRepository.findByMessageIdIn(messageIds).stream()
                        .collect(Collectors.groupingBy(MessageReaction::getMessageId));

        UUID currentUserId = current.getId();
        return messages.stream()
                .map(msg -> {
                    List<MessageReaction> msgReactions = reactionsByMessage.getOrDefault(msg.getId(), List.of());
                    List<MessageReactionInfo> reactionInfos = buildReactionInfos(msgReactions, currentUserId);
                    return MessageResponse.fromEntity(msg, reactionInfos);
                })
                .toList();
    }

    @Transactional(readOnly = true)
    public List<MessageResponse> getThreadReplies(UUID parentMessageId) {
        User current = getCurrentUserEntity();
        Message parent = messageRepository.findById(parentMessageId)
                .orElseThrow(() -> new EntityNotFoundException("Сообщение не найдено: " + parentMessageId));
        if (!channelMemberRepository.existsByChannelIdAndUserId(parent.getChannelId(), current.getId())) {
            throw new IllegalStateException("Доступ к каналу запрещен");
        }
        List<Message> replies = messageRepository.findByParentMessageId(
                parentMessageId,
                PageRequest.of(0, 200, Sort.by(Sort.Direction.ASC, "createdAt"))
        ).getContent();

        List<UUID> replyIds = replies.stream().map(Message::getId).toList();
        Map<UUID, List<MessageReaction>> reactionsByMessage = replyIds.isEmpty()
                ? Map.of()
                : messageReactionRepository.findByMessageIdIn(replyIds).stream()
                        .collect(Collectors.groupingBy(MessageReaction::getMessageId));

        UUID currentUserId = current.getId();
        return replies.stream()
                .map(msg -> {
                    List<MessageReaction> msgReactions = reactionsByMessage.getOrDefault(msg.getId(), List.of());
                    List<MessageReactionInfo> reactionInfos = buildReactionInfos(msgReactions, currentUserId);
                    return MessageResponse.fromEntity(msg, reactionInfos);
                })
                .toList();
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

        // Increment parent replyCount for thread replies
        if (request.parentMessageId() != null) {
            Message parent = messageRepository.findById(request.parentMessageId()).orElse(null);
            if (parent != null) {
                parent.incrementReplyCount();
                messageRepository.save(parent);
            }
        }

        Channel channel = channelRepository.findById(channelId)
                .orElseThrow(() -> new EntityNotFoundException("Канал не найден: " + channelId));
        channel.setLastMessageAt(Instant.now());
        channelRepository.save(channel);

        // Send notification to other channel members
        try {
            List<ChannelMember> members = channelMemberRepository.findByChannelId(channelId);
            String preview = message.getContent() != null && message.getContent().length() > 80
                    ? message.getContent().substring(0, 80) + "..."
                    : message.getContent();
            for (ChannelMember member : members) {
                if (member.getUserId().equals(current.getId())) continue;
                try {
                    notificationService.send(
                            member.getUserId(),
                            current.getFullName() + " в " + channel.getName(),
                            preview,
                            NotificationType.MESSAGE,
                            "Message",
                            message.getId(),
                            "/messaging"
                    );
                } catch (Exception e) {
                    log.debug("Failed to send message notification to user {}: {}", member.getUserId(), e.getMessage());
                }
            }
        } catch (Exception e) {
            log.warn("Failed to send message notifications: {}", e.getMessage());
        }

        auditService.logCreate("Message", message.getId());

        // Broadcast new message to channel topic for real-time delivery
        try {
            simpMessagingTemplate.convertAndSend(
                    "/topic/channel." + channelId + ".messages",
                    Map.of("messageId", message.getId().toString(), "channelId", channelId.toString())
            );
        } catch (Exception e) {
            log.debug("Failed to broadcast message via WebSocket: {}", e.getMessage());
        }

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
    public void deleteMessage(UUID messageId) {
        User current = getCurrentUserEntity();
        Message message = messageRepository.findById(messageId)
                .orElseThrow(() -> new EntityNotFoundException("Сообщение не найдено: " + messageId));
        if (!current.getId().equals(message.getAuthorId())) {
            throw new IllegalStateException("Удалять можно только свои сообщения");
        }
        message.softDelete();
        messageRepository.save(message);
        auditService.logDelete("Message", messageId);
    }

    @Transactional
    public void unpinMessage(UUID messageId) {
        Message message = messageRepository.findById(messageId)
                .orElseThrow(() -> new EntityNotFoundException("Сообщение не найдено: " + messageId));
        message.setIsPinned(false);
        message.setPinnedBy(null);
        message.setPinnedAt(null);
        messageRepository.save(message);
    }

    @Transactional(readOnly = true)
    public List<ChannelMemberResponse> getChannelMembers(UUID channelId) {
        User current = getCurrentUserEntity();
        if (!channelMemberRepository.existsByChannelIdAndUserId(channelId, current.getId())) {
            throw new IllegalStateException("Доступ к каналу запрещен");
        }
        List<ChannelMember> members = channelMemberRepository.findByChannelId(channelId);

        // Enrich with online status
        List<UUID> userIds = members.stream().map(ChannelMember::getUserId).toList();
        Map<UUID, UserStatus> statusMap = userIds.isEmpty()
                ? Map.of()
                : userStatusRepository.findByUserIdIn(userIds).stream()
                        .collect(Collectors.toMap(UserStatus::getUserId, s -> s));

        return members.stream()
                .map(m -> {
                    UserStatus status = statusMap.get(m.getUserId());
                    String availabilityStr = "OFFLINE";
                    if (status != null && status.getAvailabilityStatus() != null) {
                        availabilityStr = status.getAvailabilityStatus().name();
                    }
                    return ChannelMemberResponse.fromEntityWithStatus(m, availabilityStr);
                })
                .toList();
    }

    @Transactional
    public ChannelMemberResponse addMember(UUID channelId, UUID userId) {
        User current = getCurrentUserEntity();
        UUID organizationId = current.getOrganizationId();
        if (organizationId == null) {
            throw new IllegalStateException("Организация пользователя не определена");
        }

        Channel channel = channelRepository.findById(channelId)
                .filter(c -> !c.isDeleted())
                .orElseThrow(() -> new EntityNotFoundException("Канал не найден: " + channelId));

        if (!channelMemberRepository.existsByChannelIdAndUserId(channelId, current.getId())) {
            throw new IllegalStateException("Доступ к каналу запрещен");
        }
        if (channelMemberRepository.existsByChannelIdAndUserId(channelId, userId)) {
            throw new IllegalStateException("Пользователь уже является участником канала");
        }

        User user = userRepository.findById(userId)
                .filter(u -> !u.isDeleted())
                .orElseThrow(() -> new EntityNotFoundException("Пользователь не найден: " + userId));
        if (user.getOrganizationId() == null || !organizationId.equals(user.getOrganizationId())) {
            throw new IllegalStateException("Нельзя добавить пользователя из другой организации");
        }

        ChannelMember cm = ChannelMember.builder()
                .channelId(channelId)
                .userId(userId)
                .userName(user.getFullName())
                .role(ChannelMemberRole.MEMBER)
                .joinedAt(Instant.now())
                .build();
        cm = channelMemberRepository.save(cm);
        channel.incrementMemberCount();
        channelRepository.save(channel);

        return ChannelMemberResponse.fromEntity(cm);
    }

    @Transactional(readOnly = true)
    public List<MessageResponse> getPinnedMessages(UUID channelId) {
        User current = getCurrentUserEntity();
        if (!channelMemberRepository.existsByChannelIdAndUserId(channelId, current.getId())) {
            throw new IllegalStateException("Доступ к каналу запрещен");
        }
        List<Message> messages = messageRepository.findPinnedByChannelId(channelId);
        List<UUID> messageIds = messages.stream().map(Message::getId).toList();
        Map<UUID, List<MessageReaction>> reactionsByMessage = messageIds.isEmpty()
                ? Map.of()
                : messageReactionRepository.findByMessageIdIn(messageIds).stream()
                        .collect(Collectors.groupingBy(MessageReaction::getMessageId));

        UUID currentUserId = current.getId();
        return messages.stream()
                .map(msg -> {
                    List<MessageReaction> msgReactions = reactionsByMessage.getOrDefault(msg.getId(), List.of());
                    List<MessageReactionInfo> reactionInfos = buildReactionInfos(msgReactions, currentUserId);
                    return MessageResponse.fromEntity(msg, reactionInfos);
                })
                .toList();
    }

    @Transactional
    public void updateFavoriteNote(UUID messageId, String note) {
        User current = getCurrentUserEntity();
        MessageFavorite favorite = messageFavoriteRepository
                .findByMessageIdAndUserId(messageId, current.getId())
                .orElseThrow(() -> new EntityNotFoundException("Избранное не найдено"));
        favorite.setNote(note);
        messageFavoriteRepository.save(favorite);
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

    @Transactional(readOnly = true)
    public List<OrgUserResponse> getOrganizationUsers(String search) {
        User current = getCurrentUserEntity();
        UUID orgId = current.getOrganizationId();
        if (orgId == null) return List.of();

        List<User> users = userRepository.findByOrganizationId(orgId, PageRequest.of(0, 100, Sort.by("firstName", "lastName"))).getContent();

        if (search != null && !search.isBlank()) {
            String lower = search.toLowerCase();
            users = users.stream()
                    .filter(u -> (u.getFullName() != null && u.getFullName().toLowerCase().contains(lower))
                            || (u.getEmail() != null && u.getEmail().toLowerCase().contains(lower)))
                    .toList();
        }

        // Batch fetch online statuses
        List<UUID> userIds = users.stream().map(User::getId).toList();
        Map<UUID, UserStatus> statusMap = userIds.isEmpty()
                ? Map.of()
                : userStatusRepository.findByUserIdIn(userIds).stream()
                        .collect(Collectors.toMap(UserStatus::getUserId, s -> s));

        return users.stream()
                .filter(u -> !u.isDeleted())
                .map(u -> {
                    UserStatus status = statusMap.get(u.getId());
                    boolean isOnline = status != null && Boolean.TRUE.equals(status.getIsOnline());
                    return new OrgUserResponse(u.getId(), u.getFullName(), u.getEmail(), u.getAvatarUrl(), isOnline);
                })
                .toList();
    }

    @Transactional(readOnly = true)
    public List<MessageReactionInfo> getMessageReactions(UUID messageId) {
        User current = getCurrentUserEntity();
        List<MessageReaction> reactions = messageReactionRepository.findByMessageId(messageId);
        return buildReactionInfos(reactions, current.getId());
    }

    private List<MessageReactionInfo> buildReactionInfos(List<MessageReaction> reactions, UUID currentUserId) {
        Map<String, List<MessageReaction>> grouped = reactions.stream()
                .collect(Collectors.groupingBy(MessageReaction::getEmoji));
        return grouped.entrySet().stream()
                .map(entry -> new MessageReactionInfo(
                        entry.getKey(),
                        entry.getValue().size(),
                        entry.getValue().stream().map(MessageReaction::getUserName).toList(),
                        entry.getValue().stream().anyMatch(r -> r.getUserId().equals(currentUserId))
                ))
                .toList();
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
