package com.material.server.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.material.server.entity.MenuView;
import com.material.server.mapper.MenuViewMapper;
import com.material.server.service.MenuViewService;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class MenuViewServiceImpl extends ServiceImpl<MenuViewMapper, MenuView> implements MenuViewService {

    @Override
    public List<MenuView> listByUserIdAndPageType(String userId, String pageType) {
        return list(new LambdaQueryWrapper<MenuView>()
                .eq(MenuView::getUserId, userId)
                .eq(MenuView::getPageType, pageType)
                .orderByDesc(MenuView::getCreateTime));
    }
}
