package com.material.server.service.impl;

import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.material.server.entity.MaterialApplication;
import com.material.server.mapper.MaterialApplicationMapper;
import com.material.server.service.MaterialApplicationService;
import org.springframework.stereotype.Service;

@Service
public class MaterialApplicationServiceImpl
    extends ServiceImpl<MaterialApplicationMapper, MaterialApplication>
    implements MaterialApplicationService {
}
