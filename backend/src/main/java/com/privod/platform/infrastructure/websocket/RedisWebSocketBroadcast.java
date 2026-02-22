package com.privod.platform.infrastructure.websocket;

import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.autoconfigure.condition.ConditionalOnBean;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.redis.connection.RedisConnectionFactory;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.data.redis.listener.PatternTopic;
import org.springframework.data.redis.listener.RedisMessageListenerContainer;
import org.springframework.data.redis.listener.adapter.MessageListenerAdapter;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

import java.util.Map;

/**
 * Redis-backed WebSocket broadcast service.
 * <p>
 * Publishes STOMP messages to a Redis pub/sub channel so that all pod instances
 * can forward them to their locally-connected WebSocket clients.
 * <p>
 * This enables horizontal scaling: a message sent on Pod A is received by Pod B
 * via Redis and forwarded to clients connected to Pod B.
 * <p>
 * Only activated when Redis is available ({@link RedisConnectionFactory} bean present).
 */
@Slf4j
@Service
@RequiredArgsConstructor
@ConditionalOnBean(RedisConnectionFactory.class)
public class RedisWebSocketBroadcast {

    static final String CHANNEL = "ws:broadcast";

    private final StringRedisTemplate redisTemplate;
    private final SimpMessagingTemplate messagingTemplate;
    private final ObjectMapper objectMapper;

    /**
     * Publish a message to all pod instances via Redis pub/sub.
     *
     * @param destination STOMP destination (e.g. "/topic/project.123")
     * @param payload     message object (will be serialized to JSON)
     */
    public void publish(String destination, Object payload) {
        try {
            String json = objectMapper.writeValueAsString(
                    Map.of("destination", destination, "payload", objectMapper.writeValueAsString(payload)));
            redisTemplate.convertAndSend(CHANNEL, json);
        } catch (Exception e) {
            log.error("Failed to publish WebSocket broadcast via Redis: {}", e.getMessage());
            // Fall back to local delivery
            messagingTemplate.convertAndSend(destination, payload);
        }
    }

    /**
     * Called by the Redis listener when a broadcast message arrives.
     * Forwards the message to the local SimpleBroker for delivery to connected clients.
     */
    public void onMessage(String jsonMessage) {
        try {
            @SuppressWarnings("unchecked")
            Map<String, String> envelope = objectMapper.readValue(jsonMessage, Map.class);
            String destination = envelope.get("destination");
            String payloadJson = envelope.get("payload");
            if (destination != null && payloadJson != null) {
                messagingTemplate.convertAndSend(destination, payloadJson);
                log.debug("WS broadcast forwarded: destination={}", destination);
            }
        } catch (Exception e) {
            log.warn("Failed to process Redis WebSocket broadcast: {}", e.getMessage());
        }
    }
}

/**
 * Redis listener container configuration for WebSocket broadcast.
 * Activated only when Redis is available.
 */
@Configuration
@ConditionalOnBean(RedisConnectionFactory.class)
class RedisWebSocketListenerConfig {

    @Bean
    MessageListenerAdapter wsMessageListenerAdapter(RedisWebSocketBroadcast broadcast) {
        MessageListenerAdapter adapter = new MessageListenerAdapter(broadcast, "onMessage");
        adapter.setSerializer(new org.springframework.data.redis.serializer.StringRedisSerializer());
        return adapter;
    }

    @Bean
    RedisMessageListenerContainer wsRedisMessageListenerContainer(
            RedisConnectionFactory connectionFactory,
            MessageListenerAdapter wsMessageListenerAdapter) {
        RedisMessageListenerContainer container = new RedisMessageListenerContainer();
        container.setConnectionFactory(connectionFactory);
        container.addMessageListener(wsMessageListenerAdapter,
                new PatternTopic(RedisWebSocketBroadcast.CHANNEL));
        return container;
    }
}
