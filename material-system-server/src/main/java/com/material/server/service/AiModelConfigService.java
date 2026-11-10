package com.material.server.service;

import com.baomidou.mybatisplus.extension.service.IService;
import com.material.server.entity.AiModelConfig;

/**
 * AI 模型网关配置服务
 */
public interface AiModelConfigService extends IService<AiModelConfig> {

    /**
     * 设为默认配置（清除其他默认标记）
     */
    void setDefault(Long id);

    /**
     * 获取当前默认且启用的配置；不存在时返回 null
     */
    AiModelConfig getDefaultConfig();
}
