package com.material.server.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;
import java.time.LocalDateTime;

@Data
@TableName("component_token")
public class ComponentToken {
    
    @TableId(type = IdType.AUTO)
    private Long id;
    
    private String componentName;
    
    private String tokenKey;
    
    private String tokenType;
    
    private String defaultLightValue;
    
    private String defaultDarkValue;
    
    private String currentLightValue;
    
    private String currentDarkValue;
    
    private String description;
    
    private Integer sortOrder;
    
    @TableField(fill = FieldFill.INSERT_UPDATE)
    private LocalDateTime updatedAt;
}
