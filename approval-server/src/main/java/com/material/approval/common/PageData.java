package com.material.approval.common;

import java.util.List;

public record PageData<T>(List<T> records, long total, long current, long size) {
}
