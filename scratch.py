import os
import re
import glob

phase_dir = ".planning/phases/01-account-ownership-and-tenancy"
plan_files = sorted(glob.glob(os.path.join(phase_dir, "*-PLAN.md")))

for plan_file in plan_files:
    with open(plan_file, "r") as f:
        content = f.read()
    
    plan_id = os.path.basename(plan_file).split("-")[1]
    
    wave = 1
    m_wave = re.search(r"wave:\s*(\d+)", content)
    if m_wave:
        wave = m_wave.group(1)
        
    tasks = re.findall(r"<task[^>]*>([\s\S]*?)</task>", content)
    for i, task in enumerate(tasks):
        task_id = f"01-{plan_id}-0{i+1}"
        
        name = re.search(r"<name>(.*?)</name>", task)
        name = name.group(1) if name else ""
        
        reqs_m = re.search(r"<acceptance_criteria>([\s\S]*?)</acceptance_criteria>", task)
        reqs = []
        if reqs_m:
            reqs = re.findall(r"REQ-\w+", reqs_m.group(1))
        
        auto_m = re.search(r"<automated>(.*?)</automated>", task)
        auto = auto_m.group(1) if auto_m else ""
        has_auto = "MISSING" not in auto and auto.strip() != ""
        
        cmd_m = re.search(r"`([^`]+)`", auto)
        cmd = cmd_m.group(1) if cmd_m else ""
        
        print(f"Task: {task_id}")
        print(f"Plan: {plan_id}")
        print(f"Wave: {wave}")
        print(f"Name: {name}")
        print(f"Reqs: {reqs}")
        print(f"Has Auto: {has_auto}")
        print(f"Command: {cmd}")
        print(f"Auto details: {auto}")
        print("---")
