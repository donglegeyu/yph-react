package com.material.approval.dto;

import java.time.LocalDateTime;

public record ProcessDefVO(
        String id,
        String key,
        String name,
        int version,
        String deploymentId,
        LocalDateTime deployTime,
        boolean suspended) {
}
