package com.privod.platform.modules.auth.web.dto;

import java.util.List;

public record TwoFactorVerifySetupResponse(
        List<String> recoveryCodes
) {
}
