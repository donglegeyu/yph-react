package com.material.server.vo;

import lombok.Data;
import java.time.LocalDateTime;
import java.util.List;

/**
 * 工匠列表 VO
 * 在 Craftsman 主表字段基础上，追加从 craftsman_skill 中间表 + skill 表
 * 批量查询得到的技能名和证书示例图，供列表接口返回。
 */
@Data
public class CraftsmanListVO {

    private Long id;
    private String craftsmanCode;
    private String name;
    private String phone;
    private String userAccount;
    private String email;
    private String serviceProviderName;
    private String sourceChannel;
    private String craftsmanCategory;
    private Integer craftsmanType;
    private String region;
    private String serviceSkills;
    private LocalDateTime registerTime;
    private Integer status;
    private String birthday;
    private String idCardNo;
    private Integer age;
    private String residentialAddress;
    private String residentialAreaCode;
    private String residentialStreet;
    private String residentialDetail;
    private String idCardValidDate;
    private String serviceArea;
    private String idCardImages;
    private String workCertificate;
    private String serviceRecord;
    private String noCriminalCertificate;
    private LocalDateTime createTime;
    private LocalDateTime updateTime;

    /** 技能名（逗号分隔，来自 skill 表） */
    private String serviceSkillNames;

    /** 品牌（逗号分隔，来自 craftsman_brand 关联表） */
    private String brandNames;

    /** 证书示例图（逗号分隔，合并所有技能的 example_image） */
    private String serviceSkillImages;

    /** 接单能力：按技能维度组装的证书数据 */
    private List<CertificateItem> certificates;

    @Data
    public static class CertificateItem {
        private String skillName;
        private String certificateType;
        private String certificateImage;
        private String category1;
        private String category2;
        private String category3;
    }
}
