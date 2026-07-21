package com.material.server.controller;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.material.server.common.BusinessException;
import com.material.server.common.PageResult;
import com.material.server.common.Result;
import com.material.server.dto.PageDefinitionDTO;
import com.material.server.entity.PageDefinition;
import com.material.server.service.PageDefinitionService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping("/api/page-definitions")
@RequiredArgsConstructor
public class PageDefinitionController {

    private final PageDefinitionService pageDefinitionService;

    /**
     * 列表（分页）
     */
    @GetMapping
    public Result<PageResult<PageDefinition>> list(
            @RequestParam(defaultValue = "1") Integer current,
            @RequestParam(defaultValue = "20") Integer size,
            @RequestParam(required = false) String pageKey,
            @RequestParam(required = false) String pageName,
            @RequestParam(required = false) String status) {

        Page<PageDefinition> page = new Page<>(current, size);
        LambdaQueryWrapper<PageDefinition> query = new LambdaQueryWrapper<>();

        if (pageKey != null && !pageKey.isEmpty()) {
            query.like(PageDefinition::getPageKey, pageKey);
        }
        if (pageName != null && !pageName.isEmpty()) {
            query.like(PageDefinition::getPageName, pageName);
        }
        if (status != null && !status.isEmpty()) {
            query.eq(PageDefinition::getStatus, status);
        }
        query.orderByDesc(PageDefinition::getUpdatedTime);

        Page<PageDefinition> result = pageDefinitionService.page(page, query);
        long total = pageDefinitionService.count(query);

        PageResult<PageDefinition> pageResult = PageResult.of(
                result.getRecords(), total, result.getCurrent(), result.getSize());
        return Result.success(pageResult);
    }

    /**
     * 获取 schema（反序列化 JSON）
     */
    @GetMapping("/{id}/schema")
    public Result<PageDefinitionDTO> getSchema(@PathVariable Long id) {
        return Result.success(pageDefinitionService.getSchema(id));
    }

    /**
     * 获取详情（返回 entity 本身，不含 schema 反序列化）
     */
    @GetMapping("/{id}")
    public Result<PageDefinition> detail(@PathVariable Long id) {
        return Result.success(pageDefinitionService.getById(id));
    }

    /**
     * 保存草稿（创建或更新）
     */
    @PostMapping("/save")
    public Result<Long> save(@RequestBody PageDefinitionDTO dto,
                             @RequestHeader(value = "X-User-Name", required = false) String operator) {
        Long id = pageDefinitionService.saveSchema(dto, operator != null ? operator : "system");
        return Result.success(id);
    }

    /**
     * 发布
     *
     * @param id       页面定义 ID
     * @param domainId 当前域 ID（菜单仅同步到该域，不跨域开放）
     */
    @PostMapping("/{id}/publish")
    public Result<Void> publish(@PathVariable Long id,
                                @RequestParam(required = false) Long domainId) {
        pageDefinitionService.publish(id, domainId);
        return Result.success();
    }

    /**
     * 删除
     */
    @DeleteMapping("/{id}")
    public Result<Void> delete(@PathVariable Long id) {
        pageDefinitionService.removeById(id);
        return Result.success();
    }
}
