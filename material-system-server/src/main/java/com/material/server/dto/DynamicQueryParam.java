package com.material.server.dto;

import lombok.Data;

/**
 * 动态查询参数
 *
 * filter 语法：field:op:value 多条件用逗号分隔
 *   op ∈ {eq, ne, like, ll, rl, gt, gte, lt, lte, in, null, notnull}
 *   示例：name:like:张,status:eq:1,create_time:gte:2026-01-01
 *   in 的 value 用 | 分隔：id:in:1|2|3
 *   null/notnull 无需 value：deleted:null
 *
 * orderBy 语法：field:dir，dir ∈ {asc, desc}
 *   示例：create_time:desc
 */
@Data
public class DynamicQueryParam {

    /** 表名（必填） */
    private String table;

    /** 当前页，默认 1 */
    private Integer current = 1;

    /** 每页大小，默认 20，上限 200 */
    private Integer size = 20;

    /**
     * 查询列，逗号分隔；为空则 SELECT *
     * 示例：id,name,phone
     */
    private String select;

    /**
     * 过滤条件，逗号分隔的 field:op:value
     */
    private String filter;

    /**
     * 排序：field:dir
     */
    private String orderBy;
}
