package com.material.server.dto;

import lombok.Data;

/**
 * 后端数据管理 - 概览统计
 */
@Data
public class DbMetaSummaryDTO {

    /** 物理表数量 */
    private int tableCount;

    /** 字段数量 */
    private int columnCount;

    /** 有注释的字段数量 */
    private int commentedColumnCount;

    /** 字段注释完整度（百分比，保留一位小数） */
    private double commentRate;

    /** 真实外键数量 */
    private int foreignKeyCount;

    /** 自动推断的关系数量（不含外键与人工） */
    private int inferredRelationCount;

    /** 人工维护的关系数量 */
    private int manualRelationCount;

    /** 默认隐藏的内部表数量 */
    private int hiddenTableCount;
}
