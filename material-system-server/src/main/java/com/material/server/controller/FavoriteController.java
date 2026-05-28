package com.material.server.controller;

import com.material.server.common.Result;
import com.material.server.entity.Favorite;
import com.material.server.service.FavoriteService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping("/api/favorites")
@RequiredArgsConstructor
public class FavoriteController {

    private final FavoriteService favoriteService;

    private static final Long CURRENT_USER_ID = 1L;

    @GetMapping
    public Result<List<Favorite>> list() {
        List<Favorite> favorites = favoriteService.listByUserId(CURRENT_USER_ID);
        return Result.success(favorites);
    }

    @PostMapping
    public Result<Long> add(@RequestBody Favorite favorite) {
        if (favoriteService.exists(CURRENT_USER_ID, favorite.getMenuKey())) {
            return Result.error(400, "已收藏该菜单");
        }

        favorite.setUserId(CURRENT_USER_ID);
        favorite.setCreateTime(LocalDateTime.now());
        favorite.setUpdateTime(LocalDateTime.now());
        favoriteService.save(favorite);
        
        Long newId = favorite.getId();
        if (newId == null) {
            List<Favorite> list = favoriteService.listByUserId(CURRENT_USER_ID);
            newId = list.stream()
                    .filter(f -> f.getMenuKey().equals(favorite.getMenuKey()))
                    .findFirst()
                    .map(Favorite::getId)
                    .orElse(null);
        }

        return Result.success(newId);
    }

    @DeleteMapping("/{id}")
    public Result<Void> delete(@PathVariable Long id) {
        favoriteService.removeById(id);
        return Result.success();
    }

    @DeleteMapping("/menu/{menuKey}")
    public Result<Void> deleteByMenuKey(@PathVariable String menuKey) {
        List<Favorite> favorites = favoriteService.listByUserId(CURRENT_USER_ID);
        Favorite favorite = favorites.stream()
                .filter(f -> f.getMenuKey().equals(menuKey))
                .findFirst()
                .orElse(null);

        if (favorite != null) {
            favoriteService.removeById(favorite.getId());
        }

        return Result.success();
    }
}
