import os

def clean_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        lines = f.readlines()
    
    new_lines = [line for line in lines if "创新:" not in line and "innovation:" not in line]
    
    with open(filepath, 'w', encoding='utf-8') as f:
        f.writelines(new_lines)

def run():
    src_dir = 'src'
    for root, dirs, files in os.walk(src_dir):
        for file in files:
            if file.endswith('.jsx') or file.endswith('.js'):
                clean_file(os.path.join(root, file))
    print("Cleanup complete.")

if __name__ == "__main__":
    run()
