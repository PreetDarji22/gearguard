import os
import re

def clean_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    # catch (err) -> catch
    content = re.sub(r'catch\s*\(\s*(?:err|error)\s*\)', 'catch', content)
    
    # Reports.jsx unused startOfMonth
    if filepath.endswith('Reports.jsx'):
        content = re.sub(r',\s*startOfMonth', '', content)
        content = re.sub(r'startOfMonth\s*,', '', content)

    # RequestBoard.jsx unused arrayMove, getDocs, isOverlay, event
    if filepath.endswith('RequestBoard.jsx'):
        content = re.sub(r',\s*arrayMove', '', content)
        content = re.sub(r'arrayMove\s*,', '', content)
        content = re.sub(r',\s*getDocs', '', content)
        content = re.sub(r'getDocs\s*,', '', content)
        
        # for isOverlay:
        # const SortableTask = ({ task, onTaskClick, isAdmin, isOverlay }) => {
        content = re.sub(r',\s*isOverlay', '', content)
        content = re.sub(r'isOverlay\s*,', '', content)
        
        # for event: (event) => ...
        content = re.sub(r'\(\s*event\s*\)\s*=>', '() =>', content)
        content = re.sub(r'event\s*=>', '() =>', content)
        
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)

def run():
    src_dir = 'src'
    for root, dirs, files in os.walk(src_dir):
        for file in files:
            if file.endswith('.jsx') or file.endswith('.js'):
                clean_file(os.path.join(root, file))
    print("Cleanup complete.")

if __name__ == "__main__":
    run()
