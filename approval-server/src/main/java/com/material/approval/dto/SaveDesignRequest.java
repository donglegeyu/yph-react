package com.material.approval.dto;

/** 保存流程设计（designJson 可空 = 仅改名；processKey 仅创建时生效，为空则自动生成） */
public record SaveDesignRequest(String name, String processKey, String designJson) {
}
