package com.material.server.service;

import com.material.server.common.PageResult;
import com.material.server.dto.DynamicQueryParam;

import java.util.Map;

/**
 * 动态查询服务：按 tableName 分页查询业务数据
 * 供页面生成器的动态列表页 / 详情页使用
 */
public interface DynamicQueryService {

    /**
     * 通用分页查询
     *
     * @param param 查询参数（table/current/size/select/filter/orderBy）
     * @return 分页结果
     */
    PageResult<Map<String, Object>> query(DynamicQueryParam param);
}
