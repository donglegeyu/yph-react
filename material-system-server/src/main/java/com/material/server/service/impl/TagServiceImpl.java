package com.material.server.service.impl;

import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.material.server.entity.Tag;
import com.material.server.mapper.TagMapper;
import com.material.server.service.TagService;
import org.springframework.stereotype.Service;

@Service
public class TagServiceImpl
    extends ServiceImpl<TagMapper, Tag>
    implements TagService {
}
