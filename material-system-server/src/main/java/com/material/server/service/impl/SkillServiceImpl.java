package com.material.server.service.impl;

import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.material.server.entity.Skill;
import com.material.server.mapper.SkillMapper;
import com.material.server.service.SkillService;
import org.springframework.stereotype.Service;

@Service
public class SkillServiceImpl
    extends ServiceImpl<SkillMapper, Skill>
    implements SkillService {
}
