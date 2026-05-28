package com.material.server.dto;

import lombok.Data;
import java.time.LocalDateTime;

@Data
public class DesignTokenDTO {
    private Long id;
    private Long categoryId;
    private String categoryCode;
    private String name;
    private String tokenKey;
    private String tokenType;
    private String defaultValue;
    private String currentValue;
    private String customValue;
    private String description;
    private Boolean isAntDesignToken;
    private String antDesignTokenName;
    private Integer sortOrder;
    private LocalDateTime updatedAt;
}
