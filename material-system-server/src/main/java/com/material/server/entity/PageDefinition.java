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

    private String originalMenuPath;

    private String schemaJson;

    private String status;

    /** 最新建表脚本版本号（发布时由 MigrationScriptService 生成） */
    private Integer migrationVersion;

    /** 迁移状态：not_generated-未生成 pending-待入库 ready-已就绪 */
    private String migrationStatus;

    private String createdBy;

    private String updatedBy;

    private LocalDateTime createdTime;

    private LocalDateTime updatedTime;

    @TableLogic
    private Integer deleted;
}
