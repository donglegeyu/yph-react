package com.material.server.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.material.server.dto.SysUserVO;
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
import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class SysUserServiceImpl extends ServiceImpl<SysUserMapper, SysUser> implements SysUserService {

    private final SysUserDomainMapper sysUserDomainMapper;
    private final SysDomainMapper sysDomainMapper;

    @Override
    public IPage<SysUserVO> page(Page<SysUser> page, String username, Integer status) {
        LambdaQueryWrapper<SysUser> query = new LambdaQueryWrapper<>();
        if (username != null && !username.isEmpty()) {
            query.like(SysUser::getUsername, username);
        }
        if (status != null) {
            query.eq(SysUser::getStatus, status);
        }
        query.orderByDesc(SysUser::getCreateTime);
        IPage<SysUser> userPage = page(page, query);

        List<SysUser> users = userPage.getRecords();
        IPage<SysUserVO> voPage = userPage.convert(user -> {
            SysUserVO vo = new SysUserVO();
            vo.setId(user.getId());
            vo.setUsername(user.getUsername());
            vo.setNickname(user.getNickname());
            vo.setStatus(user.getStatus());
            vo.setCreateTime(user.getCreateTime());
            vo.setUpdateTime(user.getUpdateTime());
            return vo;
        });

        if (users.isEmpty()) {
            voPage.getRecords().forEach(vo -> vo.setDomains(Collections.emptyList()));
            return voPage;
        }

        List<Long> userIds = users.stream().map(SysUser::getId).collect(Collectors.toList());

        LambdaQueryWrapper<SysUserDomain> userDomainQuery = new LambdaQueryWrapper<>();
        userDomainQuery.in(SysUserDomain::getUserId, userIds);
        List<SysUserDomain> userDomains = sysUserDomainMapper.selectList(userDomainQuery);

        Map<Long, List<Long>> userIdToDomainIds = userDomains.stream()
                .collect(Collectors.groupingBy(
                        SysUserDomain::getUserId,
                        Collectors.mapping(SysUserDomain::getDomainId, Collectors.toList())));

        List<Long> allDomainIds = userDomains.stream()
                .map(SysUserDomain::getDomainId)
                .distinct()
                .collect(Collectors.toList());

        Map<Long, String> domainIdToName;
        if (allDomainIds.isEmpty()) {
            domainIdToName = Collections.emptyMap();
        } else {
            List<SysDomain> domains = sysDomainMapper.selectBatchIds(allDomainIds);
            domainIdToName = domains.stream()
                    .collect(Collectors.toMap(SysDomain::getId, SysDomain::getDomainName));
        }

        Map<Long, String> finalDomainIdToName = domainIdToName;
        voPage.getRecords().forEach(vo -> {
            List<Long> domainIds = userIdToDomainIds.getOrDefault(vo.getId(), Collections.emptyList());
            List<SysUserVO.DomainBrief> briefs = domainIds.stream()
                    .map(domainId -> new SysUserVO.DomainBrief(
                            domainId,
                            finalDomainIdToName.getOrDefault(domainId, "未知域")))
                    .collect(Collectors.toList());
            vo.setDomains(briefs);
        });

        return voPage;
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
