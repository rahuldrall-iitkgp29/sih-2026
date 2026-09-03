import os

files = ['change.tool.ts', 'changeVqa.tool.ts', 'opticalSar.tool.ts']
base_dir = r"C:\Users\iitkg\OneDrive\Documents\sih\backend\src\tools"

for f in files:
    path = os.path.join(base_dir, f)
    with open(path, 'r', encoding='utf-8') as file:
        content = file.read()
    
    # We want to find `  }`);\n      addTraceStep(state, `
    idx = content.find("  }`);\n      addTraceStep(state, ")
    if idx != -1:
        # find the end of the block
        end_idx = content.find("  }\n", idx)
        if end_idx != -1:
            content = content[:idx] + "  }\n" + content[end_idx+4:]
            
    with open(path, 'w', encoding='utf-8') as file:
        file.write(content)
print("Fixed exact string!")
