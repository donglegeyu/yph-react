package com.material.server.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableField;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableLogic;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.time.LocalDateTime;

/**
 * 页面生成器迁移脚本存档
 * 系统发布页面时生成的 Flyway 增量脚本文本（只生成、不执行，项目红线）
 */
@Data
@TableName("page_migration_script")
public class PageMigrationScript {

    @TableId(type = IdType.AUTO)
    private Long id;

    private Long pageDefinitionId;

    private String pageKey;

    private String pageName;

    /** 脚本版本号（对应 V{version}） */
    private Integer version;

    /** 建议文件名，如 V26__dynamic_demo_asset_create.sql */
    private String fileName;

    /** 脚本类型：create-建表 alter-加列 */
    private String scriptType;

    /** 脚本文本内容 */
    private String content;

    /** 创建人（对应表列 create_by，与 V25 建表列名一致） */
    private String createBy;

    private LocalDateTime createTime;

    private String updateBy;

    private LocalDateTime updateTime;

    @TableLogic
    private Integer deleted;

    /** 页面当前迁移状态（列表联查用，非表字段） */
    @TableField(exist = false)
    private String migrationStatus;
}
