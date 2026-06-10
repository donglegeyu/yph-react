package com.material.server.service.impl;

import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.material.server.entity.SecurityCheck;
import com.material.server.mapper.SecurityCheckMapper;
import com.material.server.service.SecurityCheckService;
import org.springframework.stereotype.Service;

@Service
public class SecurityCheckServiceImpl
    extends ServiceImpl<SecurityCheckMapper, SecurityCheck>
    implements SecurityCheckService {
}
