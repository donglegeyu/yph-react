package com.material.server.controller;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.material.server.auth.UserContext;
import com.material.server.common.PageResult;
import com.material.server.common.Result;
import com.material.server.entity.NotifyMessageTemplate;
import com.material.server.service.NotifyMessageTemplateService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;

@RestController
@RequestMapping("/api/notify-templates")
@RequiredArgsConstructor
public class NotifyMessageTemplateController {

    private final NotifyMessageTemplateService templateService;

    @GetMapping
    public Result<PageResult<NotifyMessageTemplate>> list(
            @RequestParam(defaultValue = "1") Integer current,
            @RequestParam(defaultValue = "20") Integer size,
            @RequestParam(required = false) String code,
            @RequestParam(required = false) String name,
            @RequestParam(required = false) Integer type,
            @RequestParam(required = false) Integer status) {

        Page<NotifyMessageTemplate> page = new Page<>(current, size);
        LambdaQueryWrapper<NotifyMessageTemplate> query = new LambdaQueryWrapper<>();
        if (code != null && !code.isEmpty()) {
            query.like(NotifyMessageTemplate::getCode, code);
        }
        if (name != null && !name.isEmpty()) {
            query.like(NotifyMessageTemplate::getName, name);
        }
        if (type != null) {
            query.eq(NotifyMessageTemplate::getType, type);
        }
        if (status != null) {
            query.eq(NotifyMessageTemplate::getStatus, status);
        }
        query.orderByDesc(NotifyMessageTemplate::getCreateTime);

        Page<NotifyMessageTemplate> result = templateService.page(page, query);
        long total = templateService.count(query);
        return Result.success(PageResult.of(
                result.getRecords(), total, result.getCurrent(), result.getSize()));
    }

    @GetMapping("/{id}")
    public Result<NotifyMessageTemplate> detail(@PathVariable Long id) {
        return Result.success(templateService.getById(id));
    }

    @PostMapping
    public Result<Long> create(@RequestBody NotifyMessageTemplate template) {
        if (template.getCode() == null || template.getCode().isEmpty()) {
            return Result.error("模板编码不能为空");
        }
        long exists = templateService.lambdaQuery()
                .eq(NotifyMessageTemplate::getCode, template.getCode())
                .count();
        if (exists > 0) {
            return Result.error("模板编码已存在: " + template.getCode());
        }
        if (template.getStatus() == null) {
            template.setStatus(1);
        }
        if (template.getType() == null) {
            template.setType(1);
        }
        UserContext.JwtUser user = UserContext.get();
        if (template.getCreateBy() == null && user != null) {
            template.setCreateBy(user.username());
        }
        LocalDateTime now = LocalDateTime.now();
        template.setCreateTime(now);
        template.setUpdateTime(now);
        templateService.save(template);
        return Result.success(template.getId());
    }

    @PutMapping("/{id}")
    public Result<Void> update(@PathVariable Long id, @RequestBody NotifyMessageTemplate template) {
        if (template.getCode() != null && !template.getCode().isEmpty()) {
            long exists = templateService.lambdaQuery()
                    .eq(NotifyMessageTemplate::getCode, template.getCode())
                    .ne(NotifyMessageTemplate::getId, id)
                    .count();
            if (exists > 0) {
                return Result.error("模板编码已存在: " + template.getCode());
            }
        }
        template.setId(id);
        template.setUpdateTime(LocalDateTime.now());
        templateService.updateById(template);
        return Result.success();
    }

    @DeleteMapping("/{id}")
    public Result<Void> delete(@PathVariable Long id) {
        templateService.removeById(id);
        return Result.success();
    }
}
