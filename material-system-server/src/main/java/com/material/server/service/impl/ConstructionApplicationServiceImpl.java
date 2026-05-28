package com.material.server.service.impl;

import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.material.server.entity.ConstructionApplication;
import com.material.server.mapper.ConstructionApplicationMapper;
import com.material.server.service.ConstructionApplicationService;
import org.springframework.stereotype.Service;

@Service
public class ConstructionApplicationServiceImpl
    extends ServiceImpl<ConstructionApplicationMapper, ConstructionApplication>
    implements ConstructionApplicationService {
}
