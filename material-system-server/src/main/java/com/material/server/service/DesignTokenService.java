package com.material.server.service;

import com.baomidou.mybatisplus.extension.service.IService;
import com.material.server.entity.DesignToken;
import java.util.List;

public interface DesignTokenService extends IService<DesignToken> {
    List<DesignToken> getTokensWithCategory();
}
