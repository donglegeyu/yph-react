package com.material.server.dto;

import lombok.Data;

/**
 * 后端数据管理 - 字段信息
 */
@Data
public class DbMetaColumnDTO {

    /** 字段名 */
    private String columnName;

    /** 完整类型，如 bigint(20)、varchar(100) */
    private String columnType;

    /** 基础类型，如 bigint、varchar */
    private String dataType;

    /** 是否可空 */
    private boolean nullable;

    /** 默认值 */
    private String columnDefault;

    /** 字段注释 */
    private String comment;

    /** 是否主键 */
    private boolean primaryKey;

    /** 额外属性，如 auto_increment */
    private String extra;

    /** 推断/配置出的关联目标，如 sys_user.id */
    private String relationTarget;

    /** 关联来源：fk / convention / manual */
    private String relationSource;
}
