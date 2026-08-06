package com.material.server.controller;

import com.material.server.common.PageResult;
import com.material.server.common.Result;
import com.material.server.dto.DynamicQueryParam;
import com.material.server.service.DynamicQueryService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

/**
 * 动态数据查询接口
 * 供页面生成器的动态列表页 / 详情页按 tableName 拉取真实业务数据
 *
 * 安全：
 * 1. table/字段名必须符合标识符白名单（在 service 层校验）
 * 2. 所有值用 ? 占位符，依赖 PreparedStatement 转义
 * 3. 操作符用枚举白名单
 * 4. 强制分页边界 size ∈ [1, 200]
 * 5. orderBy 方向白名单
 * 6. 表存在性二次校验（information_schema）
 */
@Slf4j
@RestController
@RequestMapping("/api/dynamic")
@RequiredArgsConstructor
public class DynamicQueryController {

    private final DynamicQueryService dynamicQueryService;

    /**
     * 通用分页查询
     *
     * @param table    表名（必填）
     * @param current  当前页，默认 1
     * @param size     每页大小，默认 20，上限 200
     * @param select   查询列，逗号分隔；为空则 SELECT *
     * @param filter   过滤条件，格式 field:op:value 多条件用逗号分隔
     * @param orderBy  排序，格式 field:dir，dir ∈ {asc, desc}
     */
    @GetMapping("/query")
    public Result<PageResult<Map<String, Object>>> query(
            @RequestParam String table,
            @RequestParam(defaultValue = "1") Integer current,
            @RequestParam(defaultValue = "20") Integer size,
            @RequestParam(required = false) String select,
            @RequestParam(required = false) String filter,
            @RequestParam(required = false) String orderBy) {

        DynamicQueryParam param = new DynamicQueryParam();
        param.setTable(table);
        param.setCurrent(current);
        param.setSize(size);
        param.setSelect(select);
        param.setFilter(filter);
        param.setOrderBy(orderBy);

        PageResult<Map<String, Object>> result = dynamicQueryService.query(param);
        return Result.success(result);
    }
}
