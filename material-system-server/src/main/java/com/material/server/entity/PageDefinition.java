package com.material.server.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;
import java.time.LocalDateTime;

@Data
@TableName("page_definition")
public class PageDefinition {

    @TableId(type = IdType.AUTO)
    private Long id;

    private String pageKey;

    private String pageName;

    private String templateType;

    private String tableName;

    private String apiPrefix;

    private String menuLinkMode;

    private Long parentMenuId;

    private Long bindMenuId;

    private String schemaJson;

    private String status;

    private String createdBy;

    private LocalDateTime createdTime;

    private LocalDateTime updatedTime;

    @TableLogic
    private Integer deleted;
}
