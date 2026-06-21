package com.material.server.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.material.server.entity.CraftsmanBrand;
import org.apache.ibatis.annotations.Delete;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

@Mapper
public interface CraftsmanBrandMapper extends BaseMapper<CraftsmanBrand> {

    @Delete("DELETE FROM craftsman_brand WHERE craftsman_id = #{craftsmanId}")
    int physicalDeleteByCraftsmanId(@Param("craftsmanId") Long craftsmanId);
}
