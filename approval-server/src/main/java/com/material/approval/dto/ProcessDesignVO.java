package com.material.approval.dto;

import java.time.LocalDateTime;

/** 流程设计器草稿（列表场景 designJson 传 null） */
public record ProcessDesignVO(
        Long id,
        String processKey,
        String name,
        String designJson,
        int publishedVersion,
        LocalDateTime updateTime) {
}
