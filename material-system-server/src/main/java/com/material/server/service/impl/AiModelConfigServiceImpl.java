package com.material.server.service.impl;

import com.baomidou.mybatisplus.core.conditions.update.LambdaUpdateWrapper;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.material.server.entity.AiModelConfig;
import com.material.server.mapper.AiModelConfigMapper;
import com.material.server.service.AiModelConfigService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AiModelConfigServiceImpl extends ServiceImpl<AiModelConfigMapper, AiModelConfig>
        implements AiModelConfigService {

    @Override
    @Transactional
    public void setDefault(Long id) {
        AiModelConfig config = getById(id);
        if (config == null) {
            throw new IllegalArgumentException("配置不存在");
        }
        // 先清除其他默认标记，再设置目标（逻辑删除由 @TableLogic 自动过滤）
        update(new LambdaUpdateWrapper<AiModelConfig>()
                .eq(AiModelConfig::getIsDefault, 1)
                .ne(AiModelConfig::getId, id)
                .set(AiModelConfig::getIsDefault, 0));
        update(new LambdaUpdateWrapper<AiModelConfig>()
                .eq(AiModelConfig::getId, id)
                .set(AiModelConfig::getIsDefault, 1)
                .set(AiModelConfig::getStatus, 1));
    }

    @Override
    public AiModelConfig getDefaultConfig() {
        return lambdaQuery()
                .eq(AiModelConfig::getIsDefault, 1)
                .eq(AiModelConfig::getStatus, 1)
                .last("LIMIT 1")
                .one();
    }
}
