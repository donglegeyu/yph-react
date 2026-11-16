package com.material.server.service.impl;

import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.material.server.entity.NotifyMessageTemplate;
import com.material.server.mapper.NotifyMessageTemplateMapper;
import com.material.server.service.NotifyMessageTemplateService;
import org.springframework.stereotype.Service;

@Service
public class NotifyMessageTemplateServiceImpl extends ServiceImpl<NotifyMessageTemplateMapper, NotifyMessageTemplate>
        implements NotifyMessageTemplateService {
}
