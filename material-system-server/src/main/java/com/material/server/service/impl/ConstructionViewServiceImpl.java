package com.material.server.service.impl;

import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.material.server.entity.ConstructionView;
import com.material.server.mapper.ConstructionViewMapper;
import com.material.server.service.ConstructionViewService;
import org.springframework.stereotype.Service;

@Service
public class ConstructionViewServiceImpl
    extends ServiceImpl<ConstructionViewMapper, ConstructionView>
    implements ConstructionViewService {
}
