#!/usr/bin/env python3
import zipfile
import os
import shutil

vsix_file = 'taskmanager-vscode-1.2.0.vsix'
temp_dir = 'temp_vsix_extract'
extract_dir = os.path.join(temp_dir, 'extension')

# Распаковываем VSIX
with zipfile.ZipFile(vsix_file, 'r') as z:
    z.extractall(temp_dir)

# Копируем axios
if os.path.exists('node_modules/axios'):
    dest_axios = os.path.join(extract_dir, 'node_modules', 'axios')
    os.makedirs(os.path.dirname(dest_axios), exist_ok=True)
    if os.path.exists(dest_axios):
        shutil.rmtree(dest_axios)
    shutil.copytree('node_modules/axios', dest_axios)
    print('Copied axios to package')

# Переупаковываем
with zipfile.ZipFile(vsix_file, 'w', zipfile.ZIP_DEFLATED) as z:
    for root, dirs, files in os.walk(temp_dir):
        for file in files:
            file_path = os.path.join(root, file)
            arcname = os.path.relpath(file_path, temp_dir)
            z.write(file_path, arcname)

# Удаляем временную директорию
shutil.rmtree(temp_dir)
print('VSIX repackaged with axios')

