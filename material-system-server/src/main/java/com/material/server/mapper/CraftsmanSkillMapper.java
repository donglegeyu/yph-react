package com.material.server.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.material.server.entity.CraftsmanSkill;
import org.apache.ibatis.annotations.Delete;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

@Mapper
public interface CraftsmanSkillMapper extends BaseMapper<CraftsmanSkill> {

    @Delete("DELETE FROM craftsman_skill WHERE craftsman_id = #{craftsmanId}")
    int physicalDeleteByCraftsmanId(@Param("craftsmanId") Long craftsmanId);
}
