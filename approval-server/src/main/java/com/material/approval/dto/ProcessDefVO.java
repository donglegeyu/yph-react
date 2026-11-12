package com.material.approval.dto;

import java.time.LocalDateTime;

public record ProcessDefVO(
        String key,
        String name,
        int version,
        String deploymentId,
        LocalDateTime deployTime) {
}
