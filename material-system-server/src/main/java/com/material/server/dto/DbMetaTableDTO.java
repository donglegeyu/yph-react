package com.material.server.dto;

import lombok.Data;

/**
 * 后端数据管理 - 表清单项
 */
@Data
public class DbMetaTableDTO {

    /** 物理表名 */
    private String tableName;

    /** 展示名：配置表中文名优先，其次表注释，最后表名 */
    private String displayName;

    /** 数据库中的表注释 */
    private String tableComment;

    /** 是否在配置表中自定义了展示名 */
    private boolean customDisplayName;

    /** 分组名 */
    private String groupName;

    /** 是否默认隐藏（内部表） */
    private boolean hidden;

    /** 字段数量 */
    private int columnCount;

    /** 数据行数（InnoDB 估算值，仅作规模参考） */
    private long rowCount;
}
