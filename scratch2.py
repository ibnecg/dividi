import os
import re
import glob
import yaml

phase_dir = ".planning/phases/01-account-ownership-and-tenancy"
plan_files = sorted(glob.glob(os.path.join(phase_dir, "*-PLAN.md")))

for plan_file in plan_files:
    with open(plan_file, "r") as f:
        content = f.read()
    
    # Extract YAML frontmatter
    frontmatter_match = re.search(r"^---\n(.*?)\n---", content, re.DOTALL)
    if frontmatter_match:
        try:
            frontmatter = yaml.safe_load(frontmatter_match.group(1))
            reqs = frontmatter.get("requirements", [])
            print(f"{os.path.basename(plan_file)}: {reqs}")
        except Exception as e:
            print(f"Error parsing frontmatter for {plan_file}: {e}")
