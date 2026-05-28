package com.material.server.service;

public interface UserPreferenceService {
    /** 获取用户偏好 */
    String getPreference(Long userId, String key);

    /** 保存用户偏好 */
    void savePreference(Long userId, String key, String value);
}