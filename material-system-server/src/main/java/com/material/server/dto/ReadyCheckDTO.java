package com.material.server.dto;

import lombok.Data;

import java.util.ArrayList;
import java.util.List;

/**
 * 建表就绪检查结果
 */
@Data
public class ReadyCheckDTO {

    /** 目标表是否已存在于数据库 */
    private Boolean tableExists;

    /** 迁移状态：ready / pending / not_generated */
    private String status;

    /** 缺失的列清单（空列表 = 全部就绪） */
    private List<String> missingColumns = new ArrayList<>();
}
