package com.material.server.dto;

import lombok.Data;

import java.util.List;

/**
 * 后端数据管理 - 索引信息
 */
@Data
public class DbMetaIndexDTO {

    /** 索引名 */
    private String indexName;

    /** 是否唯一索引 */
    private boolean unique;

    /** 是否主键索引 */
    private boolean primary;

    /** 索引列（按索引内顺序） */
    private List<String> columns;
}
