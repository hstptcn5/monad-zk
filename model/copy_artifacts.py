#!/usr/bin/env python3
"""
Helper script to copy ZK artifacts to public/ folder for frontend access
"""

import os
import shutil

# Files to copy
artifacts = [
    'settings.json',
    'network.ezkl',
    'pk.key',
    'vk.key',
]

# Source and destination
source_dir = os.path.dirname(__file__)
dest_dir = os.path.join(source_dir, '..', 'public')

def copy_artifacts():
    """Copy ZK artifacts to public folder"""
    os.makedirs(dest_dir, exist_ok=True)
    
    copied = []
    missing = []
    
    for artifact in artifacts:
        src = os.path.join(source_dir, artifact)
        dst = os.path.join(dest_dir, artifact)
        
        if os.path.exists(src):
            shutil.copy2(src, dst)
            copied.append(artifact)
            print(f"✓ Copied {artifact} → public/{artifact}")
        else:
            missing.append(artifact)
            print(f"✗ Missing: {artifact}")
    
    print("\n" + "=" * 60)
    if copied:
        print(f"✓ Successfully copied {len(copied)} file(s) to public/")
    if missing:
        print(f"⚠ Missing {len(missing)} file(s). Run generate_proof.py first.")
    print("=" * 60)

if __name__ == "__main__":
    copy_artifacts()

