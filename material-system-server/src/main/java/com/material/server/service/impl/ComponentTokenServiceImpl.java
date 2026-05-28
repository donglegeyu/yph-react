package com.material.server.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.QueryWrapper;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.material.server.entity.ComponentToken;
import com.material.server.mapper.ComponentTokenMapper;
import com.material.server.service.ComponentTokenService;
import org.springframework.stereotype.Service;
import java.util.List;

@Service
public class ComponentTokenServiceImpl extends ServiceImpl<ComponentTokenMapper, ComponentToken> implements ComponentTokenService {
    
    @Override
    public List<ComponentToken> getTokensByComponent(String componentName) {
        QueryWrapper<ComponentToken> queryWrapper = new QueryWrapper<>();
        queryWrapper.eq("component_name", componentName);
        queryWrapper.orderByAsc("sort_order");
        return list(queryWrapper);
    }
}
