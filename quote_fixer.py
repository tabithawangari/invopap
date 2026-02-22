#!/usr/bin/env python3
import os

file_path = 'telegram-bot/src/handlers.ts'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Replace smart quotes with straight quotes
content = content.replace('\u2019', "'")  # Right single quotation mark
content = content.replace('\u2018', "'")  # Left single quotation mark
content = content.replace('\u201c', '"')  # Left double quotation mark
content = content.replace('\u201d', '"')  # Right double quotation mark

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)

print('Successfully replaced all smart quotes with straight quotes')
