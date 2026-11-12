package com.material.server.dto;

import lombok.Data;

/**
 * 后端数据管理 - 表间关系
 */
@Data
public class DbMetaRelationDTO {

    /** 源表 */
    private String fromTable;

    /** 源字段 */
    private String fromColumn;

    /** 目标表 */
    private String toTable;

    /** 目标字段 */
    private String toColumn;

    /** 来源：fk 真实外键 / convention 命名约定推断 / manual 人工维护 */
    private String source;

    /** 置信度：high / medium / low */
    private String confidence;

    /** 关系类型：many_to_one / one_to_one / self_reference */
    private String relationType;

    /** 关系说明 */
    private String label;

    /** 源表展示名 */
    private String fromTableLabel;

    /** 目标表展示名 */
    private String toTableLabel;
}
