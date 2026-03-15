package com.privod.platform.modules.integration.slack.web.dto;

import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class UpdateSlackConfigRequest {

    @Size(max = 255, message = "Название workspace не должно превышать 255 символов")
    private String workspaceName;

    @Size(max = 1000, message = "Webhook URL не должен превышать 1000 символов")
    private String webhookUrl;

    @Size(max = 500, message = "Bot token не должен превышать 500 символов")
    private String botToken;

    @Size(max = 100, message = "Channel ID не должен превышать 100 символов")
    private String channelId;

    private Boolean enabled;
}
