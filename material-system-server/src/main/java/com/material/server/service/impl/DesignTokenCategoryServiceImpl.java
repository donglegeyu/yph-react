package com.material.server.service.impl;

import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.material.server.entity.DesignTokenCategory;
import com.material.server.mapper.DesignTokenCategoryMapper;
import com.material.server.service.DesignTokenCategoryService;
import org.springframework.stereotype.Service;

@Service
public class DesignTokenCategoryServiceImpl extends ServiceImpl<DesignTokenCategoryMapper, DesignTokenCategory> implements DesignTokenCategoryService {
}
