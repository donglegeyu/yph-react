package com.material.server.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.material.server.entity.UserPreference;
import com.material.server.mapper.UserPreferenceMapper;
import com.material.server.service.UserPreferenceService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class UserPreferenceServiceImpl implements UserPreferenceService {

    private final UserPreferenceMapper userPreferenceMapper;

    @Override
    public String getPreference(Long userId, String key) {
        LambdaQueryWrapper<UserPreference> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(UserPreference::getUserId, userId)
               .eq(UserPreference::getPreferenceKey, key);
        UserPreference pref = userPreferenceMapper.selectOne(wrapper);
        return pref != null ? pref.getPreferenceValue() : null;
    }

    @Override
    public void savePreference(Long userId, String key, String value) {
        LambdaQueryWrapper<UserPreference> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(UserPreference::getUserId, userId)
               .eq(UserPreference::getPreferenceKey, key);
        UserPreference pref = userPreferenceMapper.selectOne(wrapper);

        if (pref != null) {
            pref.setPreferenceValue(value);
            pref.setUpdateTime(LocalDateTime.now());
            userPreferenceMapper.updateById(pref);
        } else {
            pref = new UserPreference();
            pref.setUserId(userId);
            pref.setPreferenceKey(key);
            pref.setPreferenceValue(value);
            pref.setCreateTime(LocalDateTime.now());
            pref.setUpdateTime(LocalDateTime.now());
            userPreferenceMapper.insert(pref);
        }
    }
}