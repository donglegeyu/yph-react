package com.material.server.service;

import com.baomidou.mybatisplus.extension.service.IService;
import com.material.server.entity.MenuView;

import java.util.List;

public interface MenuViewService extends IService<MenuView> {
    List<MenuView> listByUserIdAndPageType(String userId, String pageType);
}
