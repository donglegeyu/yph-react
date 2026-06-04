package com.material.server.service.impl;

import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.material.server.entity.CraftsmanView;
import com.material.server.mapper.CraftsmanViewMapper;
import com.material.server.service.CraftsmanViewService;
import org.springframework.stereotype.Service;

@Service
public class CraftsmanViewServiceImpl
    extends ServiceImpl<CraftsmanViewMapper, CraftsmanView>
    implements CraftsmanViewService {
}
