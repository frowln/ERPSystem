package com.privod.platform.modules.messaging.web;

import com.privod.platform.infrastructure.web.ApiResponse;
import com.privod.platform.modules.messaging.domain.AvailabilityStatus;
import com.privod.platform.modules.messaging.service.MessagingService;
import com.privod.platform.modules.messaging.web.dto.AddReactionRequest;
import com.privod.platform.modules.messaging.web.dto.ChannelResponse;
import com.privod.platform.modules.messaging.web.dto.CreateChannelRequest;
import com.privod.platform.modules.messaging.web.dto.EditMessageRequest;
import com.privod.platform.modules.messaging.web.dto.FavoriteResponse;
import com.privod.platform.modules.messaging.web.dto.MessageResponse;
import com.privod.platform.modules.messaging.web.dto.ReactionResponse;
import com.privod.platform.modules.messaging.web.dto.SendMessageRequest;
import com.privod.platform.modules.messaging.web.dto.SetUserStatusRequest;
import com.privod.platform.modules.messaging.web.dto.UserStatusResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Size;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping({"/api/messaging", "/api/messages"})
@RequiredArgsConstructor
@Tag(name = "Messaging", description = "Channels, messages, reactions, favorites and user status")
public class MessagingController {

    private final MessagingService messagingService;

    @GetMapping("/channels")
    @Operation(summary = "List channels available for current user")
    public ResponseEntity<ApiResponse<List<ChannelResponse>>> getChannels() {
        return ResponseEntity.ok(ApiResponse.ok(messagingService.getMyChannels()));
    }

    @PostMapping("/channels")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Create channel")
    public ResponseEntity<ApiResponse<ChannelResponse>> createChannel(@Valid @RequestBody CreateChannelRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.ok(messagingService.createChannel(request)));
    }

    @GetMapping("/channels/{channelId}/messages")
    @Operation(summary = "Get channel messages")
    public ResponseEntity<ApiResponse<List<MessageResponse>>> getChannelMessages(@PathVariable UUID channelId) {
        return ResponseEntity.ok(ApiResponse.ok(messagingService.getChannelMessages(channelId)));
    }

    @PostMapping("/channels/{channelId}/messages")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Send message to channel")
    public ResponseEntity<ApiResponse<MessageResponse>> sendMessage(
            @PathVariable UUID channelId,
            @Valid @RequestBody SendMessageRequest request
    ) {
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.ok(messagingService.sendMessage(channelId, request)));
    }

    @PatchMapping("/messages/{messageId}")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Edit message")
    public ResponseEntity<ApiResponse<MessageResponse>> editMessage(
            @PathVariable UUID messageId,
            @Valid @RequestBody EditMessageRequest request
    ) {
        return ResponseEntity.ok(ApiResponse.ok(messagingService.editMessage(messageId, request)));
    }

    @PostMapping("/messages/{messageId}/reactions")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Add reaction to message")
    public ResponseEntity<ApiResponse<ReactionResponse>> addReaction(
            @PathVariable UUID messageId,
            @Valid @RequestBody AddReactionRequest request
    ) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok(messagingService.addReaction(messageId, request.emoji())));
    }

    @DeleteMapping("/messages/{messageId}/reactions/{emoji}")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Remove reaction from message")
    public ResponseEntity<ApiResponse<Void>> removeReaction(
            @PathVariable UUID messageId,
            @PathVariable String emoji
    ) {
        messagingService.removeReaction(messageId, emoji);
        return ResponseEntity.ok(ApiResponse.ok());
    }

    @PostMapping("/messages/{messageId}/pin")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Pin message")
    public ResponseEntity<ApiResponse<Void>> pinMessage(@PathVariable UUID messageId) {
        messagingService.pinMessage(messageId);
        return ResponseEntity.ok(ApiResponse.ok());
    }

    @PostMapping("/messages/{messageId}/favorite")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Add message to favorites")
    public ResponseEntity<ApiResponse<FavoriteResponse>> addFavorite(
            @PathVariable UUID messageId,
            @Valid @RequestBody FavoriteNoteRequest request
    ) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok(messagingService.addFavorite(messageId, request.note())));
    }

    @DeleteMapping("/messages/{messageId}/favorite")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Remove message from favorites")
    public ResponseEntity<ApiResponse<Void>> removeFavorite(@PathVariable UUID messageId) {
        messagingService.removeFavorite(messageId);
        return ResponseEntity.ok(ApiResponse.ok());
    }

    @GetMapping("/favorites")
    @Operation(summary = "Get favorite messages for current user")
    public ResponseEntity<ApiResponse<List<FavoriteResponse>>> getMyFavorites() {
        return ResponseEntity.ok(ApiResponse.ok(messagingService.getMyFavorites()));
    }

    @GetMapping("/search")
    @Operation(summary = "Search messages visible to current user")
    public ResponseEntity<ApiResponse<List<MessageResponse>>> searchMessages(@RequestParam("q") String q) {
        return ResponseEntity.ok(ApiResponse.ok(messagingService.searchMessages(q)));
    }

    @GetMapping("/users/{userId}/status")
    @Operation(summary = "Get user messaging status")
    public ResponseEntity<ApiResponse<Map<String, String>>> getUserStatus(@PathVariable UUID userId) {
        UserStatusResponse status = messagingService.getUserStatus(userId);
        String normalized = normalizeAvailability(status.availabilityStatus());
        return ResponseEntity.ok(ApiResponse.ok(Map.of(
                "userId", status.userId().toString(),
                "status", normalized
        )));
    }

    @PatchMapping("/me/status")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Set my messaging status")
    public ResponseEntity<ApiResponse<UserStatusResponse>> setMyStatus(
            @RequestBody(required = false) Map<String, String> request
    ) {
        String value = request != null ? request.getOrDefault("status", "offline") : "offline";
        AvailabilityStatus availability = fromFrontendStatus(value);
        SetUserStatusRequest statusRequest = new SetUserStatusRequest(null, null, availability);
        return ResponseEntity.ok(ApiResponse.ok(messagingService.setMyStatus(statusRequest)));
    }

    private AvailabilityStatus fromFrontendStatus(String status) {
        if (status == null) {
            return AvailabilityStatus.OFFLINE;
        }
        return switch (status.trim().toLowerCase(Locale.ROOT)) {
            case "online" -> AvailabilityStatus.ONLINE;
            case "away" -> AvailabilityStatus.AWAY;
            case "busy" -> AvailabilityStatus.BUSY;
            case "dnd", "do_not_disturb", "do-not-disturb" -> AvailabilityStatus.DO_NOT_DISTURB;
            default -> AvailabilityStatus.OFFLINE;
        };
    }

    private String normalizeAvailability(AvailabilityStatus status) {
        if (status == null) {
            return "offline";
        }
        return switch (status) {
            case ONLINE -> "online";
            case AWAY -> "away";
            case BUSY, DO_NOT_DISTURB -> "busy";
            case OFFLINE -> "offline";
        };
    }

    public record FavoriteNoteRequest(
            @Size(max = 1000, message = "Заметка не должна превышать 1000 символов")
            String note
    ) {
    }
}
