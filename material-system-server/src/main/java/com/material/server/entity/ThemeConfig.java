package com.material.server.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;
import java.time.LocalDateTime;

@Data
@TableName("theme_config")
public class ThemeConfig {
    
    @TableId(type = IdType.AUTO)
    private Long id;
    
    private String themeName;
    
    private Boolean isActive;
    
    private String configJson;
    
    @TableField(fill = FieldFill.INSERT)
    private LocalDateTime createdAt;
    
    @TableField(fill = FieldFill.INSERT_UPDATE)
    private LocalDateTime updatedAt;
}
