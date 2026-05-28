package com.material.server.service;

import com.material.server.entity.IconConfigRequest;
import java.util.Map;

public interface IconConfigService {
    Map<String, Object> getIconConfig();
    void saveIconConfig(IconConfigRequest request);
}
