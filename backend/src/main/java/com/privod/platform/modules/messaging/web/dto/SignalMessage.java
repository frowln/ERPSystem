package com.privod.platform.modules.messaging.web.dto;

public record SignalMessage(
    String type,
    String callId,
    String fromUserId,
    String toUserId,
    Object sdp,
    Object candidate
) {}
