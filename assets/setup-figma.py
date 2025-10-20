#!/usr/bin/env python3

import re
import os
import sys
import shutil

def main():
    if len(sys.argv) < 3:
        print("Usage: python3 setup-figma.py <path-to-figma> <path-to-project>")
        print("Example: python3 setup-figma.py /home/ubuntu/upload/figma/{fileId}/{frameId}/content/ /home/ubuntu/elearning-site/")
        sys.exit(1)
    
    figma_content_path = sys.argv[1]
    project_path = sys.argv[2]
    
    # Construct figma paths
    code_file = os.path.join(figma_content_path, 'code.jsx')
    
    # Construct paths
    output_file = os.path.join(project_path, 'src', 'App.jsx')
    project_assets_dir = os.path.join(project_path, 'src', 'assets')
    
    # Check if output file exists
    if not os.path.exists(output_file):
        print(f"Error: Output file does not exist! Make sure you have ran manus-create-react-app and the folder name is correct.")
        print(f"Missing file: {output_file}")
        sys.exit(1)
    
    # Read the original code
    try:
        with open(code_file, 'r') as f:
            content = f.read()
    except FileNotFoundError:
        print(f"Error: File {code_file} not found")
        sys.exit(1)
    
    # Construct figma assets directory path
    figma_assets_dir = os.path.join(figma_content_path, 'assets')
    
    # Check if figma assets directory exists
    if not os.path.exists(figma_assets_dir):
        print(f"Warning: Figma assets directory {figma_assets_dir} not found")
        print("Available assets will be skipped")
        figma_available_assets = []
    else:
        figma_available_assets = os.listdir(figma_assets_dir)
    
    # Ensure project assets directory exists
    if not os.path.exists(project_assets_dir):
        os.makedirs(project_assets_dir, exist_ok=True)
        print(f"Created project assets directory: {project_assets_dir}")
    
    # Create mapping from placeholder URL to asset file
    url_to_asset = {}
    import_statements = []
    import_counter = 1
    
    # Asset mapping based on the extracted assets
    asset_map = {
        "1:1703": "1-1703.webp"
    }
    
    # Process each known asset
    for node_id, expected_filename in asset_map.items():
        placeholder_url = f"https://placehold.com/{node_id}"
        
        # Check if the asset file exists in figma assets directory
        figma_asset_path = os.path.join(figma_assets_dir, expected_filename)
        project_asset_path = os.path.join(project_assets_dir, expected_filename)
        
        if os.path.exists(figma_asset_path):
            # Only copy if asset does not already exist in project
            if not os.path.exists(project_asset_path):
                shutil.copy2(figma_asset_path, project_asset_path)
                print(f"✓ Copied asset: {expected_filename}")
            else:
                print(f"→ Asset exists: {expected_filename}")
            
            import_name = f'asset{import_counter}'
            url_to_asset[placeholder_url] = import_name
            import_statements.append(f"import {import_name} from './assets/{expected_filename}'")
            import_counter += 1
        else:
            print(f"⚠ Missing asset: {expected_filename}")
    
    # Replace placeholder URLs in content
    replacements_made = 0
    for url, import_name in url_to_asset.items():
        old_pattern = f'src="{url}"'
        new_pattern = f'src={{{import_name}}}' 
        if old_pattern in content:
            content = content.replace(old_pattern, new_pattern)
            replacements_made += 1
    
    # Create the complete React component
    if import_statements:
        react_component = f'''import './App.css'
{chr(10).join(import_statements)}

function App() {{
  return (
    {content}
  )
}}

export default App
'''
    else:
        # No assets to import, just wrap the content
        react_component = f'''import './App.css'

function App() {{
  return (
    {content}
  )
}}

export default App
'''
    
    # Write to specified output file
    with open(output_file, 'w') as f:
        f.write(react_component)
    
    print(f"\n🎉 Asset replacement completed!")
    print(f"   - Processed {len(asset_map)} potential assets")
    print(f"   - Found {len(url_to_asset)} available assets")
    print(f"   - Made {replacements_made} replacements")
    print(f"   - Generated {len(import_statements)} import statements")
    print(f"   - Created: {output_file}")
    
    if replacements_made < len(asset_map):
        missing_count = len(asset_map) - len(url_to_asset)
        print(f"\n⚠ Note: {missing_count} assets were not found in the figma assets directory")

if __name__ == "__main__":
    main()
