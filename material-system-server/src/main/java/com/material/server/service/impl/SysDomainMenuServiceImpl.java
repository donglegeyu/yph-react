package com.material.server.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.material.server.entity.SysDomainMenu;
import com.material.server.mapper.SysDomainMenuMapper;
import com.material.server.service.SysDomainMenuService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class SysDomainMenuServiceImpl extends ServiceImpl<SysDomainMenuMapper, SysDomainMenu> implements SysDomainMenuService {

    @Override
    public List<SysDomainMenu> getByDomainId(Long domainId) {
        LambdaQueryWrapper<SysDomainMenu> query = new LambdaQueryWrapper<>();
        query.eq(SysDomainMenu::getDomainId, domainId);
        query.orderByAsc(SysDomainMenu::getSort);
        return list(query);
    }

    @Override
    @Transactional
    public void saveBatch(Long domainId, List<SysDomainMenu> menus) {
        LambdaQueryWrapper<SysDomainMenu> query = new LambdaQueryWrapper<>();
        query.eq(SysDomainMenu::getDomainId, domainId);
        remove(query);

        if (menus != null && !menus.isEmpty()) {
            menus.forEach(menu -> menu.setDomainId(domainId));
            saveBatch(menus);
        }
    }

    @Override
    @Transactional
    public void deleteByDomainId(Long domainId) {
        LambdaQueryWrapper<SysDomainMenu> query = new LambdaQueryWrapper<>();
        query.eq(SysDomainMenu::getDomainId, domainId);
        remove(query);
    }
}
