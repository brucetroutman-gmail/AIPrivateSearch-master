Here’s a clean reusable checklist you can follow every time you create a new version:

---

### Checklist: Create a new isolated version

**1. Create empty GitHub repository**
- [ ] Go to GitHub → New repository
- [ ] Name it (e.g. `folderproject-v0`, `folderproject-v1`, etc.)
- [ ] Leave **everything unchecked** (no README, no .gitignore, no license)
- [ ] Click **Create repository**

**2. Clone the empty repository**
- [ ] Run:
  ```bash
  git clone https://github.com/yourusername/folderproject-vX.git
  ```
- [ ] Go into the new folder:
  ```bash
  cd folderproject-vX
  ```

**3. Copy your current project files**
- [ ] Copy **all** files and folders from your current working project into this new folder
- [ ] **Do NOT** copy the original project’s `.git` folder
- [ ] (Optional) Delete any heavy folders you don’t need right now (`node_modules`, `venv`, `dist`, etc.)

**4. Commit and push**
- [ ] Run these commands:
  ```bash
  git add .
  git commit -m "Initial commit - version X"
  git push -u origin main
  ```

**5. Open in VS Code**
- [ ] Run:
  ```bash
  code .
  ```
  or open the folder manually in VS Code

---

**Tip:**  
Keep a simple text file or note with this checklist so you can just copy-paste the commands and change the version number each time.

Would you like a version of this checklist that also includes cleaning up common folders (node_modules, __pycache__, etc.)?