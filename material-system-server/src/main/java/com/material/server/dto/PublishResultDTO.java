package com.material.server.dto;

import lombok.Data;

/**
 * 发布结果（含建表脚本联动信息）
 * 系统只生成脚本文本返回给前端展示/复制/下载，永远不执行 DDL（项目红线）
 */
@Data
public class PublishResultDTO {

    /** 生成的脚本存档 ID（无脚本时为 null） */
    private Long scriptId;

    /** 脚本版本号，如 26（对应 V26） */
    private Integer scriptVersion;

    /** 建议文件名，如 V26__dynamic_demo_asset_create.sql */
    private String fileName;

    /** 脚本类型：create-建表 alter-加列；无脚本时为 null */
    private String scriptType;

    /** 脚本文本内容（无脚本时为 null） */
    private String content;

    /** 迁移状态：pending-待入库 ready-已就绪 */
    private String migrationStatus;
}
