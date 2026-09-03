import os
import glob

files = glob.glob(r"C:\Users\iitkg\OneDrive\Documents\sih\backend\src\tools\*.tool.ts")

for path in files:
    with open(path, 'r', encoding='utf-8') as file:
        content = file.read()
    
    content = content.replace("model.status === 'available' || model.status === 'AVAILABLE'", "model.status === 'available'")
    
    with open(path, 'w', encoding='utf-8') as file:
        file.write(content)
print("Removed bad TS type check!")
