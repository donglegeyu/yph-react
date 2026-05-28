package com.material.server.service.impl;

import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.material.server.entity.ThemeConfig;
import com.material.server.mapper.ThemeConfigMapper;
import com.material.server.service.ThemeConfigService;
import org.springframework.stereotype.Service;

@Service
public class ThemeConfigServiceImpl extends ServiceImpl<ThemeConfigMapper, ThemeConfig> implements ThemeConfigService {
}
