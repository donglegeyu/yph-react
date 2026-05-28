package com.material.server.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.QueryWrapper;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.material.server.entity.DesignToken;
import com.material.server.mapper.DesignTokenMapper;
import com.material.server.service.DesignTokenService;
import org.springframework.stereotype.Service;
import java.util.List;

@Service
public class DesignTokenServiceImpl extends ServiceImpl<DesignTokenMapper, DesignToken> implements DesignTokenService {
    
    @Override
    public List<DesignToken> getTokensWithCategory() {
        QueryWrapper<DesignToken> queryWrapper = new QueryWrapper<>();
        queryWrapper.orderByAsc("category_id", "sort_order");
        return list(queryWrapper);
    }
}
