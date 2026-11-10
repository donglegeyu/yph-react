package com.material.server.dto;

import lombok.Data;

import java.util.Map;

/**
 * 动态保存参数（新增 / 编辑共用）
 *
 * id 为空 → INSERT；id 非空 → UPDATE ... WHERE id = ?
 */
@Data
public class DynamicSaveParam {

    /** 表名（必填） */
    private String table;

    /** 主键 id：null = 新增，非 null = 编辑 */
    private Long id;

    /** 业务字段值（key = 列名，value = 值），只允许表中真实存在的业务列 */
    private Map<String, Object> data;

    /** 操作人（选填）：自动写入 create_by / update_by */
    private String operator;
}
