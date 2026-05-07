#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
脚本用于查找并打印包含中文字符的行
支持多种文件类型：html, js, java, txt, py, css 等
"""

import re
import sys
import os
import argparse
from pathlib import Path

def contains_chinese(text):
    """
    使用正则表达式检测字符串中是否包含中文字符
    中文字符的Unicode范围：\u4e00-\u9fff
    """
    # 正则表达式匹配中文字符
    chinese_pattern = re.compile(r'[\u4e00-\u9fff]+')
    return bool(chinese_pattern.search(text))

def process_file(file_path):
    """处理单个文件，打印包含中文字符的行"""
    try:
        with open(file_path, 'r', encoding='utf-8') as file:
            lines = file.readlines()
            
        found_chinese = False
        for line_num, line in enumerate(lines, 1):
            if contains_chinese(line.strip()):
                if not found_chinese:
                    print(f"\n=== 文件: {file_path} ===")
                    found_chinese = True
                print(f"第{line_num}行: {line.strip()}")
                
        return found_chinese
        
    except UnicodeDecodeError:
        # 如果UTF-8解码失败，尝试其他编码
        encodings = ['gbk', 'gb2312', 'latin-1']
        for encoding in encodings:
            try:
                with open(file_path, 'r', encoding=encoding) as file:
                    lines = file.readlines()
                    
                found_chinese = False
                for line_num, line in enumerate(lines, 1):
                    if contains_chinese(line.strip()):
                        if not found_chinese:
                            print(f"\n=== 文件: {file_path} (编码: {encoding}) ===")
                            found_chinese = True
                        print(f"第{line_num}行: {line.strip()}")
                        
                return found_chinese
                
            except UnicodeDecodeError:
                continue
        
        print(f"警告: 无法解码文件 {file_path}，跳过处理")
        return False
        
    except Exception as e:
        print(f"错误: 处理文件 {file_path} 时出错: {e}")
        return False

def find_files(directory, extensions):
    """在目录中查找指定扩展名的文件"""
    files = []
    for ext in extensions:
        pattern = f"**/*{ext}"
        files.extend(Path(directory).glob(pattern))
    return files

def main():
    parser = argparse.ArgumentParser(description='查找包含中文字符的行')
    parser.add_argument('path', nargs='?', default='.', 
                       help='要搜索的文件或目录路径 (默认: 当前目录)')
    parser.add_argument('--extensions', '-e', nargs='+', 
                       default=['.html', '.js', '.java', '.txt', '.py', '.css', '.xml', '.json'],
                       help='要搜索的文件扩展名列表')
    parser.add_argument('--recursive', '-r', action='store_true',
                       help='是否递归搜索子目录')
    
    args = parser.parse_args()
    
    # 确保扩展名以点开头
    extensions = [ext if ext.startswith('.') else f'.{ext}' for ext in args.extensions]
    
    path = Path(args.path)
    
    if path.is_file():
        # 处理单个文件
        files_to_process = [path]
    elif path.is_dir():
        # 处理目录
        if args.recursive:
            files_to_process = find_files(path, extensions)
        else:
            files_to_process = []
            for ext in extensions:
                files_to_process.extend(path.glob(f"*{ext}"))
    else:
        print(f"错误: 路径 {args.path} 不存在")
        sys.exit(1)
    
    if not files_to_process:
        print("未找到匹配的文件")
        return
    
    print(f"正在搜索 {len(files_to_process)} 个文件...")
    
    total_found = 0
    for file_path in files_to_process:
        if process_file(file_path):
            total_found += 1
    
    print(f"\n=== 搜索完成 ===")
    print(f"共处理了 {len(files_to_process)} 个文件")
    print(f"其中 {total_found} 个文件包含中文字符")

if __name__ == "__main__":
    main()