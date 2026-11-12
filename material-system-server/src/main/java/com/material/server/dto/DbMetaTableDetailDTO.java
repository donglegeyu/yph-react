package com.material.server.dto;

import lombok.Data;

import java.util.List;

/**
 * 后端数据管理 - 单表详情
 */
@Data
public class DbMetaTableDetailDTO {

    /** 表基本信息 */
    private DbMetaTableDTO table;

    /** 字段列表 */
    private List<DbMetaColumnDTO> columns;

    /** 索引列表 */
    private List<DbMetaIndexDTO> indexes;

    /** 出边：本表字段指向其他表 */
    private List<DbMetaRelationDTO> outgoing;

    /** 入边：其他表字段指向本表 */
    private List<DbMetaRelationDTO> incoming;
}
