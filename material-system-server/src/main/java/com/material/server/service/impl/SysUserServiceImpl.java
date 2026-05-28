package com.material.server.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.material.server.entity.SysDomain;
import com.material.server.entity.SysUser;
import com.material.server.entity.SysUserDomain;
import com.material.server.mapper.SysDomainMapper;
import com.material.server.mapper.SysUserDomainMapper;
import com.material.server.mapper.SysUserMapper;
import com.material.server.service.SysUserService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Arrays;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class SysUserServiceImpl extends ServiceImpl<SysUserMapper, SysUser> implements SysUserService {

    private final SysUserDomainMapper sysUserDomainMapper;
    private final SysDomainMapper sysDomainMapper;

    @Override
    public IPage<SysUser> page(Page<SysUser> page, String username, Integer status) {
        LambdaQueryWrapper<SysUser> query = new LambdaQueryWrapper<>();
        if (username != null && !username.isEmpty()) {
            query.like(SysUser::getUsername, username);
        }
        if (status != null) {
            query.eq(SysUser::getStatus, status);
        }
        query.orderByDesc(SysUser::getCreateTime);
        return page(page, query);
    }

    @Override
    @Transactional
    public SysUser create(SysUser user) {
        save(user);
        return user;
    }

    @Override
    @Transactional
    public void update(Long id, SysUser user) {
        user.setId(id);
        updateById(user);
    }

    @Override
    @Transactional
    public void updateStatus(Long id, Integer status) {
        SysUser user = new SysUser();
        user.setId(id);
        user.setStatus(status);
        updateById(user);
    }

    @Override
    @Transactional
    public void assignDomains(Long userId, Long[] domainIds) {
        LambdaQueryWrapper<SysUserDomain> query = new LambdaQueryWrapper<>();
        query.eq(SysUserDomain::getUserId, userId);
        sysUserDomainMapper.delete(query);

        if (domainIds != null && domainIds.length > 0) {
            Arrays.stream(domainIds).forEach(domainId -> {
                SysUserDomain userDomain = new SysUserDomain();
                userDomain.setUserId(userId);
                userDomain.setDomainId(domainId);
                sysUserDomainMapper.insert(userDomain);
            });
        }
    }

    @Override
    public List<SysDomain> getUserDomains(Long userId) {
        LambdaQueryWrapper<SysUserDomain> query = new LambdaQueryWrapper<>();
        query.eq(SysUserDomain::getUserId, userId);
        List<SysUserDomain> userDomains = sysUserDomainMapper.selectList(query);

        if (userDomains.isEmpty()) {
            return List.of();
        }

        List<Long> domainIds = userDomains.stream()
                .map(SysUserDomain::getDomainId)
                .collect(Collectors.toList());

        return sysDomainMapper.selectBatchIds(domainIds);
    }
}
