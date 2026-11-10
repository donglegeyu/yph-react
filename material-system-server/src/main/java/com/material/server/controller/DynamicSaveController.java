package com.material.server.controller;

import com.material.server.common.Result;
import com.material.server.dto.DynamicSaveParam;
import com.material.server.service.DynamicSaveService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/**
 * 动态数据写接口
 * 供页面生成器的动态表单页（新增/编辑保存）和动态列表页（删除）使用
 *
 * 安全：沿用 DynamicQueryController 的防线（service 层校验表/列白名单 + PreparedStatement 占位符）
 */
@Slf4j
@RestController
@RequestMapping("/api/dynamic")
@RequiredArgsConstructor
public class DynamicSaveController {

    private final DynamicSaveService dynamicSaveService;

    /**
     * 新增 / 编辑保存
     *
     * body: { table, id（null=新增）, data: { 列名: 值 }, operator }
     *
     * @return 新增返回自增主键，编辑返回原 id
     */
    @PostMapping("/save")
    public Result<Long> save(@RequestBody DynamicSaveParam param,
                             @RequestHeader(value = "X-User-Name", required = false) String headerOperator) {
        // header 优先级低于 body.operator（表单页显式传的创建人信息更准确）
        if ((param.getOperator() == null || param.getOperator().isBlank())
                && headerOperator != null && !headerOperator.isBlank()) {
            param.setOperator(headerOperator);
        }
        Long id = dynamicSaveService.save(param);
        return Result.success(id);
    }

    /**
     * 按主键删除（表有 deleted 列走逻辑删除）
     */
    @DeleteMapping("/delete")
    public Result<Void> delete(@RequestParam String table,
                               @RequestParam Long id,
                               @RequestHeader(value = "X-User-Name", required = false) String operator) {
        dynamicSaveService.delete(table, id, operator);
        return Result.success();
    }
}
