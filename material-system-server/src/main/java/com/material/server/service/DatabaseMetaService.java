package com.material.server.service;

import com.material.server.dto.DbMetaRelationDTO;
import com.material.server.dto.DbMetaSummaryDTO;
import com.material.server.dto.DbMetaTableDTO;
import com.material.server.dto.DbMetaTableDetailDTO;

import java.util.List;

/**
 * 后端数据管理：只读查询数据库结构与表间关系
 */
public interface DatabaseMetaService {

    /** 概览统计 */
    DbMetaSummaryDTO getSummary();

    /** 表清单，keyword 匹配表名/注释，includeHidden 是否包含内部表 */
    List<DbMetaTableDTO> listTables(String keyword, boolean includeHidden);

    /** 单表字段、索引与关系 */
    DbMetaTableDetailDTO getTableDetail(String tableName);

    /** 关系列表，scope: all / core / inferred / manual */
    List<DbMetaRelationDTO> listRelations(String scope);

    /** 清空关系缓存 */
    void refreshCache();
}
