package com.material.server.controller;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.material.server.common.Result;
import com.material.server.entity.AiModelConfig;
import com.material.server.common.PageResult;
import com.material.server.service.AiModelConfigService;
import lombok.RequiredArgsConstructor;
import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * AI 模型网关配置管理（OpenAI 兼容接口连接参数）
 */
@RestController
@RequestMapping("/api/ai-model-configs")
@RequiredArgsConstructor
public class AiModelConfigController {

    private final AiModelConfigService aiModelConfigService;

    /** API Key 出参脱敏：保留前 3 后 4，长度不足则整体打码 */
    private String maskApiKey(String apiKey) {
        if (!StringUtils.hasText(apiKey)) {
            return "";
        }
        if (apiKey.length() <= 8) {
            return "****";
        }
        return apiKey.substring(0, 3) + "****" + apiKey.substring(apiKey.length() - 4);
    }

    private AiModelConfig mask(AiModelConfig config) {
        config.setApiKey(maskApiKey(config.getApiKey()));
        return config;
    }

    @GetMapping
    public Result<PageResult<AiModelConfig>> list(
            @RequestParam(defaultValue = "1") Integer current,
            @RequestParam(defaultValue = "20") Integer size,
            @RequestParam(required = false) String configName,
            @RequestParam(required = false) Integer status) {
        LambdaQueryWrapper<AiModelConfig> query = new LambdaQueryWrapper<>();
        if (StringUtils.hasText(configName)) {
            query.like(AiModelConfig::getConfigName, configName);
        }
        if (status != null) {
            query.eq(AiModelConfig::getStatus, status);
        }
        query.orderByDesc(AiModelConfig::getIsDefault)
                .orderByDesc(AiModelConfig::getUpdateTime);
        Page<AiModelConfig> page = aiModelConfigService.page(new Page<>(current, size), query);
        List<AiModelConfig> records = page.getRecords().stream().map(this::mask).toList();
        long total = aiModelConfigService.count(query);
        return Result.success(PageResult.of(records, total, page.getCurrent(), page.getSize()));
    }

    @PostMapping
    public Result<AiModelConfig> create(@RequestBody AiModelConfig config) {
        if (!StringUtils.hasText(config.getConfigName()) || !StringUtils.hasText(config.getBaseUrl())
                || !StringUtils.hasText(config.getApiKey()) || !StringUtils.hasText(config.getModelName())) {
            return Result.error("配置名称、网关地址、API Key、模型名均为必填");
        }
        if (config.getIsDefault() != null && config.getIsDefault() == 1) {
            aiModelConfigService.save(config);
            aiModelConfigService.setDefault(config.getId());
        } else {
            config.setIsDefault(0);
            aiModelConfigService.save(config);
        }
        return Result.success(mask(config));
    }

    @PutMapping("/{id}")
    public Result<Void> update(@PathVariable Long id, @RequestBody AiModelConfig config) {
        AiModelConfig existing = aiModelConfigService.getById(id);
        if (existing == null) {
            return Result.error("配置不存在");
        }
        config.setId(id);
        // API Key 留空表示不修改（出参为脱敏值，直接回传会被误存）
        if (!StringUtils.hasText(config.getApiKey())) {
            config.setApiKey(existing.getApiKey());
        }
        aiModelConfigService.updateById(config);
        return Result.success(null);
    }

    @PutMapping("/{id}/default")
    public Result<Void> setDefault(@PathVariable Long id) {
        try {
            aiModelConfigService.setDefault(id);
            return Result.success(null);
        } catch (IllegalArgumentException e) {
            return Result.error(e.getMessage());
        }
    }

    @DeleteMapping("/{id}")
    public Result<Void> delete(@PathVariable Long id) {
        AiModelConfig existing = aiModelConfigService.getById(id);
        if (existing == null) {
            return Result.error("配置不存在");
        }
        aiModelConfigService.removeById(id);
        return Result.success(null);
    }
}
