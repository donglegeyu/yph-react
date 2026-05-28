package com.material.server.service;

import com.baomidou.mybatisplus.extension.service.IService;
import com.material.server.entity.Favorite;
import java.util.List;

public interface FavoriteService extends IService<Favorite> {
    List<Favorite> listByUserId(Long userId);
    boolean exists(Long userId, String menuKey);
}
