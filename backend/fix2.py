import os
files = ['change.tool.ts', 'changeVqa.tool.ts', 'opticalSar.tool.ts']
base_dir = r"C:\Users\iitkg\OneDrive\Documents\sih\backend\src\tools"

for f in files:
    path = os.path.join(base_dir, f)
    with open(path, 'r', encoding='utf-8') as file:
        content = file.read()
    
    content = content.replace("  }\n  }\n\n  // Fallback", "  }\n\n  // Fallback")
    
    with open(path, 'w', encoding='utf-8') as file:
        file.write(content)
print("Removed extra brace!")
