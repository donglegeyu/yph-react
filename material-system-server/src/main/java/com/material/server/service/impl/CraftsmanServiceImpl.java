package com.material.server.service.impl;

import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.material.server.entity.Craftsman;
import com.material.server.mapper.CraftsmanMapper;
import com.material.server.service.CraftsmanService;
import org.springframework.stereotype.Service;

@Service
public class CraftsmanServiceImpl
    extends ServiceImpl<CraftsmanMapper, Craftsman>
    implements CraftsmanService {
}
