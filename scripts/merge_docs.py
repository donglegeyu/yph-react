#!/usr/bin/env python3
"""
合并所有文档生成完整的开发手册
"""

import sys
from pathlib import Path
from datetime import datetime


def merge_docs(backend_path: str, frontend_path: str,
               database_path: str, output_path: str):
    """合并所有文档"""

    output = f"# 材料申请管理系统 - 开发手册\n\n"
    output += f"> 版本: v4.0 | 自动生成: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n\n"
    output += "---\n\n"
    output += "## 📖 文档说明\n\n"
    output += "本文档由以下部分自动合并生成：\n\n"
    output += "- ✅ 后端 API 文档 (从 Swagger JSON 自动提取)\n"
    output += "- ✅ 前端组件文档 (从 Storybook 自动提取)\n"
    output += "- ✅ 数据库文档 (从实体类自动提取)\n"
    output += "- ✅ 手动维护的架构和设计文档\n\n"
    output += "> ⚠️ **注意**: 此文档由 CI/CD 自动更新，**请勿手动编辑**\n"
    output += "> 如需修改，请编辑对应的源文档并提交代码\n\n"
    output += "---\n\n"

    # 读取后端 API 文档
    if Path(backend_path).exists():
        with open(backend_path, 'r', encoding='utf-8') as f:
            backend_content = f.read()
        output += backend_content
        output += "\n\n---\n\n"
    else:
        output += "## 后端 API 文档\n\n"
        output += "*后端 API 文档将在构建时自动生成*\n\n---\n\n"

    # 读取前端组件文档
    if Path(frontend_path).exists():
        with open(frontend_path, 'r', encoding='utf-8') as f:
            frontend_content = f.read()
        output += frontend_content
        output += "\n\n---\n\n"
    else:
        output += "## 前端组件文档\n\n"
        output += "*前端组件文档将在构建时自动生成*\n\n---\n\n"

    # 读取数据库文档
    if Path(database_path).exists():
        with open(database_path, 'r', encoding='utf-8') as f:
            database_content = f.read()
        output += database_content
    else:
        output += "## 数据库文档\n\n"
        output += "*数据库文档将在构建时自动生成*\n\n"

    # 写入输出文件
    with open(output_path, 'w', encoding='utf-8') as f:
        f.write(output)

    print(f"✅ 开发手册已生成: {output_path}")


if __name__ == '__main__':
    import argparse

    parser = argparse.ArgumentParser(description='合并文档生成开发手册')
    parser.add_argument('--backend', required=True, help='后端 API 文档路径')
    parser.add_argument('--frontend', required=True, help='前端组件文档路径')
    parser.add_argument('--database', required=True, help='数据库文档路径')
    parser.add_argument('--output', required=True, help='输出文件路径')

    args = parser.parse_args()

    merge_docs(args.backend, args.frontend, args.database, args.output)
