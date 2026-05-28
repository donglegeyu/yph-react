package com.material.server.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;
import java.time.LocalDateTime;

@Data
@TableName("design_token")
public class DesignToken {
    
    @TableId(type = IdType.AUTO)
    private Long id;
    
    private Long categoryId;
    
    private String name;
    
    private String tokenKey;
    
    private String tokenType;
    
    private String defaultValue;
    
    private String currentValue;
    
    private String description;
    
    private Boolean isAntDesignToken;
    
    private String antDesignTokenName;
    
    private Integer sortOrder;
    
    @TableField(fill = FieldFill.INSERT_UPDATE)
    private LocalDateTime updatedAt;
}
