package com.material.server.service;

import com.material.server.dto.DynamicSaveParam;

/**
 * 动态数据写服务：供页面生成器的动态表单页 / 列表页写入真实业务数据
 */
public interface DynamicSaveService {

    /**
     * 新增或编辑
     *
     * @param param table + id（null=新增）+ data + operator
     * @return 新增时返回自增主键；编辑时返回原 id
     */
    Long save(DynamicSaveParam param);

    /**
     * 按主键删除（表有 deleted 列走逻辑删除，否则物理删除）
     *
     * @param table    表名
     * @param id       主键
     * @param operator 操作人（自动写入 update_by）
     */
    void delete(String table, Long id, String operator);
}
