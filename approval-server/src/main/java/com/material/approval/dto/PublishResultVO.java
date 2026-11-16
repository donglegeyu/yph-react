package com.material.approval.dto;

/** 流程设计发布结果（与 Flowable 部署后的流程定义对应） */
public record PublishResultVO(String definitionId, String key, String name, int version) {
}
