package com.material.server.service;

import com.baomidou.mybatisplus.extension.service.IService;
import com.material.server.entity.ComponentToken;
import java.util.List;

public interface ComponentTokenService extends IService<ComponentToken> {
    List<ComponentToken> getTokensByComponent(String componentName);
}
