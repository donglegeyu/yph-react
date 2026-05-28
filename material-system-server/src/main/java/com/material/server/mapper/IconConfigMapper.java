package com.material.server.mapper;

import com.material.server.entity.IconConfig;
import org.apache.ibatis.annotations.*;
import java.util.List;

@Mapper
public interface IconConfigMapper {

    @Select("SELECT * FROM icon_config ORDER BY type, sort_order")
    List<IconConfig> findAll();

    @Select("SELECT * FROM icon_config WHERE type = #{type} ORDER BY sort_order")
    List<IconConfig> findByType(@Param("type") String type);

    @Insert("<script>" +
            "INSERT INTO icon_config (type, value, label, sort_order, created_at, updated_at) VALUES " +
            "<foreach collection='list' item='item' separator=','>" +
            "(#{item.type}, #{item.value}, #{item.label}, #{item.sortOrder}, NOW(), NOW())" +
            "</foreach>" +
            "</script>")
    @Options(useGeneratedKeys = true, keyProperty = "id")
    void batchInsert(@Param("list") List<IconConfig> list);

    @Delete("DELETE FROM icon_config WHERE type = #{type}")
    void deleteByType(@Param("type") String type);

    @Delete("DELETE FROM icon_config")
    void deleteAll();

    @Insert("INSERT INTO icon_config (type, value, label, sort_order, created_at, updated_at) " +
            "VALUES (#{type}, #{value}, #{label}, #{sortOrder}, NOW(), NOW())")
    @Options(useGeneratedKeys = true, keyProperty = "id")
    void insert(IconConfig iconConfig);

    @Delete("DELETE FROM icon_config WHERE type = #{type} AND value = #{value}")
    void deleteByTypeAndValue(@Param("type") String type, @Param("value") String value);
}
