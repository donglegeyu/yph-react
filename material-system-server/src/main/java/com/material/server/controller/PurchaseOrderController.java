package com.material.server.controller;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.material.server.common.PageResult;
import com.material.server.common.Result;
import com.material.server.entity.PurchaseOrder;
import com.material.server.mapper.PurchaseOrderMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/purchase-orders")
@CrossOrigin
public class PurchaseOrderController {

    @Autowired
    private PurchaseOrderMapper purchaseOrderMapper;

    @GetMapping
    public Result<PageResult<PurchaseOrder>> list(
            @RequestParam(defaultValue = "1") Integer current,
            @RequestParam(defaultValue = "100") Integer size,
            @RequestParam(required = false) String orderNo,
            @RequestParam(required = false) String supplierName,
            @RequestParam(required = false) String status) {
        
        Page<PurchaseOrder> page = new Page<>(current, size);
        LambdaQueryWrapper<PurchaseOrder> query = new LambdaQueryWrapper<>();
        
        if (orderNo != null && !orderNo.isEmpty()) {
            query.like(PurchaseOrder::getOrderNo, orderNo);
        }
        if (supplierName != null && !supplierName.isEmpty()) {
            query.like(PurchaseOrder::getSupplierName, supplierName);
        }
        if (status != null && !status.isEmpty()) {
            query.eq(PurchaseOrder::getStatus, status);
        }
        query.orderByDesc(PurchaseOrder::getCreateTime);

        Page<PurchaseOrder> result = purchaseOrderMapper.selectPage(page, query);
        long total = purchaseOrderMapper.selectCount(query);

        PageResult<PurchaseOrder> pageResult = PageResult.of(
                result.getRecords(), total, result.getCurrent(), result.getSize());
        return Result.success(pageResult);
    }
}
