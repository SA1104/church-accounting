import sys

task_path = 'C:/Users/new-s/.gemini/antigravity/brain/734d20d3-ff67-44df-b8d8-ebadd2d42414/task.md'

with open(task_path, 'r', encoding='utf8') as f:
    task = f.read()

task = task.replace('- `[ ]`', '- `[x]`')

with open(task_path, 'w', encoding='utf8') as f:
    f.write(task)

print("Tasks marked complete")
