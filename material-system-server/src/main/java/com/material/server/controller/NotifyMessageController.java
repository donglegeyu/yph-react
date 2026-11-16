package com.material.server.controller;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.conditions.update.LambdaUpdateWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.material.server.auth.UserContext;
import com.material.server.common.PageResult;
import com.material.server.common.Result;
import com.material.server.dto.NotifySendDTO;
import com.material.server.entity.NotifyMessage;
import com.material.server.service.NotifyMessageService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;

@RestController
@RequestMapping("/api/notify-messages")
@RequiredArgsConstructor
public class NotifyMessageController {

    private final NotifyMessageService notifyMessageService;

    /** 当前用户收件箱分页 */
    @GetMapping("/my")
    public Result<PageResult<NotifyMessage>> my(
            @RequestParam(defaultValue = "1") Integer current,
            @RequestParam(defaultValue = "20") Integer size,
            @RequestParam(required = false) Integer readStatus) {
        UserContext.JwtUser user = UserContext.get();
        if (user == null || user.userId() == null) {
            return Result.error(401, "未登录");
        }
        Page<NotifyMessage> page = new Page<>(current, size);
        LambdaQueryWrapper<NotifyMessage> query = new LambdaQueryWrapper<>();
        query.eq(NotifyMessage::getUserId, user.userId());
        if (readStatus != null) {
            query.eq(NotifyMessage::getReadStatus, readStatus);
        }
        query.orderByDesc(NotifyMessage::getCreateTime);

        Page<NotifyMessage> result = notifyMessageService.page(page, query);
        long total = notifyMessageService.count(query);
        return Result.success(PageResult.of(
                result.getRecords(), total, result.getCurrent(), result.getSize()));
    }

    /** 当前用户未读数 */
    @GetMapping("/unread-count")
    public Result<Long> unreadCount() {
        UserContext.JwtUser user = UserContext.get();
        if (user == null || user.userId() == null) {
            return Result.success(0L);
        }
        long count = notifyMessageService.lambdaQuery()
                .eq(NotifyMessage::getUserId, user.userId())
                .eq(NotifyMessage::getReadStatus, 0)
                .count();
        return Result.success(count);
    }

    /** 标记单条已读 */
    @PutMapping("/read/{id}")
    public Result<Void> read(@PathVariable Long id) {
        UserContext.JwtUser user = UserContext.get();
        if (user == null || user.userId() == null) {
            return Result.error(401, "未登录");
        }
        NotifyMessage msg = notifyMessageService.getById(id);
        if (msg == null || !user.userId().equals(msg.getUserId())) {
            return Result.error("消息不存在");
        }
        if (msg.getReadStatus() == null || msg.getReadStatus() == 0) {
            NotifyMessage update = new NotifyMessage();
            update.setId(id);
            update.setReadStatus(1);
            update.setReadTime(LocalDateTime.now());
            update.setUpdateTime(LocalDateTime.now());
            notifyMessageService.updateById(update);
        }
        return Result.success();
    }

    /** 全部已读 */
    @PutMapping("/read-all")
    public Result<Void> readAll() {
        UserContext.JwtUser user = UserContext.get();
        if (user == null || user.userId() == null) {
            return Result.error(401, "未登录");
        }
        NotifyMessage update = new NotifyMessage();
        update.setReadStatus(1);
        update.setReadTime(LocalDateTime.now());
        update.setUpdateTime(LocalDateTime.now());
        LambdaUpdateWrapper<NotifyMessage> wrapper = new LambdaUpdateWrapper<>();
        wrapper.eq(NotifyMessage::getUserId, user.userId())
                .eq(NotifyMessage::getReadStatus, 0);
        notifyMessageService.update(update, wrapper);
        return Result.success();
    }

    /** 管理端发送站内信 */
    @PostMapping("/send")
    public Result<Integer> send(@RequestBody NotifySendDTO dto) {
        int count = notifyMessageService.sendByTemplate(
                dto.getTemplateCode(), dto.getUserIds(), dto.getParams(), dto.getDomainId());
        return Result.success(count);
    }
}
