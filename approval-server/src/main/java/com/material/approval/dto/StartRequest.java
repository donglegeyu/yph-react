package com.material.approval.dto;

import java.math.BigDecimal;
import java.util.List;

public record StartRequest(String title, String reason, BigDecimal amount,
                           List<Long> ccUserIds, List<String> ccUserNames) {
}
