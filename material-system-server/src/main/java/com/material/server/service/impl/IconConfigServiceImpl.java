package com.material.server.service.impl;

import com.material.server.entity.IconConfig;
import com.material.server.entity.IconConfigRequest;
import com.material.server.mapper.IconConfigMapper;
import com.material.server.service.IconConfigService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.*;

@Service
public class IconConfigServiceImpl implements IconConfigService {

    @Autowired
    private IconConfigMapper iconConfigMapper;

    @Override
    public Map<String, Object> getIconConfig() {
        List<IconConfig> allIcons = iconConfigMapper.findAll();

        List<IconConfigRequest.IconItem> preset = new ArrayList<>();
        List<IconConfigRequest.IconItem> custom = new ArrayList<>();

        for (IconConfig icon : allIcons) {
            IconConfigRequest.IconItem item = new IconConfigRequest.IconItem();
            item.setValue(icon.getValue());
            item.setLabel(icon.getLabel());
            if ("preset".equals(icon.getType())) {
                preset.add(item);
            } else if ("custom".equals(icon.getType())) {
                custom.add(item);
            }
        }

        Map<String, Object> result = new HashMap<>();
        result.put("preset", preset);
        result.put("custom", custom);
        return result;
    }

    @Override
    public void saveIconConfig(IconConfigRequest request) {
        iconConfigMapper.deleteAll();

        List<IconConfig> allIcons = new ArrayList<>();

        if (request.getPreset() != null) {
            for (int i = 0; i < request.getPreset().size(); i++) {
                IconConfigRequest.IconItem item = request.getPreset().get(i);
                IconConfig icon = new IconConfig();
                icon.setType("preset");
                icon.setValue(item.getValue());
                icon.setLabel(item.getLabel());
                icon.setSortOrder(i);
                allIcons.add(icon);
            }
        }

        if (request.getCustom() != null) {
            for (int i = 0; i < request.getCustom().size(); i++) {
                IconConfigRequest.IconItem item = request.getCustom().get(i);
                IconConfig icon = new IconConfig();
                icon.setType("custom");
                icon.setValue(item.getValue());
                icon.setLabel(item.getLabel());
                icon.setSortOrder(i);
                allIcons.add(icon);
            }
        }

        if (!allIcons.isEmpty()) {
            iconConfigMapper.batchInsert(allIcons);
        }
    }
}
