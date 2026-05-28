#!/usr/bin/env python3
"""
从 Swagger JSON 自动生成 Markdown API 文档
"""

import json
import sys
from pathlib import Path
from datetime import datetime
from typing import Dict, List, Any


def parse_swagger_json(json_path: str) -> Dict[str, Any]:
    """解析 Swagger JSON 文件"""
    with open(json_path, 'r', encoding='utf-8') as f:
        return json.load(f)


def generate_markdown(api_data: Dict[str, Any], output_path: str):
    """生成 Markdown API 文档"""

    info = api_data.get('info', {})
    title = info.get('title', 'API 文档')
    version = info.get('version', '1.0.0')
    description = info.get('description', '')

    # 收集所有路径
    paths = api_data.get('paths', {})
    tags = api_data.get('tags', [])

    # 按标签分组
    tag_groups = {}
    for path, methods in paths.items():
        for method, details in methods.items():
            if method.upper() in ['GET', 'POST', 'PUT', 'DELETE', 'PATCH']:
                method_details = details
                method_tags = method_details.get('tags', ['未分类'])

                for tag in method_tags:
                    if tag not in tag_groups:
                        tag_groups[tag] = []
                    tag_groups[tag].append({
                        'path': path,
                        'method': method.upper(),
                        'details': method_details
                    })

    # 生成 Markdown
    md_content = f"# {title}\n\n"
    md_content += f"> 版本: {version} | 自动生成时间: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n\n"
    md_content += f"{description}\n\n"
    md_content += "---\n\n"
    md_content += "## 目录\n\n"

    # 添加目录
    for i, tag in enumerate(tag_groups.keys(), 1):
        md_content += f"{i}. [{tag}](#{tag.lower().replace(' ', '-')})\n"

    md_content += "\n---\n\n"

    # 生成每个标签的文档
    for tag, endpoints in tag_groups.items():
        md_content += f"## {tag}\n\n"

        for endpoint in endpoints:
            path = endpoint['path']
            method = endpoint['method']
            details = endpoint['details']

            summary = details.get('summary', '无描述')
            description = details.get('description', '')
            parameters = details.get('parameters', [])
            request_body = details.get('requestBody', {})
            responses = details.get('responses', {})

            # 接口地址
            md_content += f"### {method} {path}\n\n"
            md_content += f"**{summary}**\n\n"

            if description:
                md_content += f"{description}\n\n"

            # 请求参数
            if parameters:
                md_content += "**请求参数:**\n\n"
                md_content += "| 参数名 | 类型 | 必填 | 说明 |\n"
                md_content += "|--------|------|------|------|\n"

                for param in parameters:
                    name = param.get('name', '')
                    param_type = param.get('schema', {}).get('type', 'string')
                    required = '是' if param.get('required', False) else '否'
                    desc = param.get('description', '')

                    md_content += f"| {name} | {param_type} | {required} | {desc} |\n"

                md_content += "\n"

            # 请求体
            if request_body:
                md_content += "**请求体:**\n\n"
                content = request_body.get('content', {})
                if 'application/json' in content:
                    schema = content['application/json'].get('schema', {})
                    md_content += f"```json\n{json.dumps(schema, indent=2, ensure_ascii=False)}\n```\n\n"

            # 响应
            if responses:
                md_content += "**响应示例:**\n\n"
                md_content += "| 状态码 | 说明 |\n"
                md_content += "|--------|------|\n"

                for status, resp in responses.items():
                    desc = resp.get('description', '')
                    md_content += f"| {status} | {desc} |\n"

                md_content += "\n"

            md_content += "---\n\n"

    # 写入文件
    with open(output_path, 'w', encoding='utf-8') as f:
        f.write(md_content)

    print(f"✅ API 文档已生成: {output_path}")


if __name__ == '__main__':
    import argparse

    parser = argparse.ArgumentParser(description='生成 API 文档')
    parser.add_argument('--input', required=True, help='Swagger JSON 文件路径')
    parser.add_argument('--output', required=True, help='输出 Markdown 文件路径')

    args = parser.parse_args()

    api_data = parse_swagger_json(args.input)
    generate_markdown(api_data, args.output)
