package com.material.server.dto;

import lombok.Data;

/**
 * 工匠申请提交 DTO
 * 直接复用 CraftsmanCreateDTO 的字段集，但为了不绑定复杂类型，
 * 这里用一个独立 DTO 承载表单提交内容，后端再转换为 CraftsmanCreateDTO。
 */
@Data
public class CraftsmanApplicationCreateDTO {

    private String applicationType;

    private String applicant;

    /** 表单主体，结构与 CraftsmanCreateDTO 一致 */
    private CraftsmanCreateDTO formData;
}
