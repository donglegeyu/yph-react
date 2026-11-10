package com.material.server.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * AI 模型网关配置（OpenAI 兼容接口连接参数）
 */
@Data
@TableName("ai_model_config")
public class AiModelConfig {

    @TableId(type = IdType.AUTO)
    private Long id;

    /** 配置名称 */
    private String configName;

    /** 网关地址（OpenAI 兼容，如 https://api.deepseek.com） */
    private String baseUrl;

    /** API Key（接口返回时脱敏） */
    private String apiKey;

    /** 模型名 */
    private String modelName;

    /** 系统提示词（缺省用内置默认） */
    private String systemPrompt;

    /** 采样温度 */
    private BigDecimal temperature;

    /** 最大输出 tokens（空则不限制） */
    private Integer maxTokens;

    /** 是否默认配置 1/0（AI 对话使用默认配置） */
    private Integer isDefault;

    /** 状态 1 启用 0 禁用 */
    private Integer status;

    /** 备注 */
    private String remark;

    private LocalDateTime createTime;

    private LocalDateTime updateTime;

    @TableLogic
    private Integer deleted;
}
