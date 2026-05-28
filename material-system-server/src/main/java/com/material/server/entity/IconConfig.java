package com.material.server.entity;

import lombok.Data;
import java.time.LocalDateTime;

@Data
public class IconConfig {
    private Long id;
    private String type;
    private String value;
    private String label;
    private Integer sortOrder;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
