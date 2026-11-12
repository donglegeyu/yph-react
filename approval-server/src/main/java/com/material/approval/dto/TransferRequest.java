package com.material.approval.dto;

public record TransferRequest(Long targetId, String targetName, String comment) {
}
