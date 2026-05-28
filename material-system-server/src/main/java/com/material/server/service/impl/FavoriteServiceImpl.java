package com.material.server.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.material.server.entity.Favorite;
import com.material.server.mapper.FavoriteMapper;
import com.material.server.service.FavoriteService;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class FavoriteServiceImpl extends ServiceImpl<FavoriteMapper, Favorite> implements FavoriteService {

    @Override
    public List<Favorite> listByUserId(Long userId) {
        return list(new LambdaQueryWrapper<Favorite>()
                .eq(Favorite::getUserId, userId)
                .orderByAsc(Favorite::getSort)
                .orderByDesc(Favorite::getId));
    }

    @Override
    public boolean exists(Long userId, String menuKey) {
        return count(new LambdaQueryWrapper<Favorite>()
                .eq(Favorite::getUserId, userId)
                .eq(Favorite::getMenuKey, menuKey)) > 0;
    }
}
