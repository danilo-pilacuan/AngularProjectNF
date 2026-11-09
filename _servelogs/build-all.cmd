setlocal
cd /d C:\dev\AngularProjectNF\mfe-projects
echo === MFE-PROJECTS ===
call npx ng build 2>&1
cd /d C:\dev\AngularProjectNF\mfe-reports
echo === MFE-REPORTS ===
call npx ng build 2>&1
cd /d C:\dev\AngularProjectNF\mfe-admin
echo === MFE-ADMIN ===
call npx ng build 2>&1
cd /d C:\dev\AngularProjectNF\mfe-governance
echo === MFE-GOVERNANCE ===
call npx ng build 2>&1
cd /d C:\dev\AngularProjectNF\shell
echo === SHELL ===
call npx ng build 2>&1
