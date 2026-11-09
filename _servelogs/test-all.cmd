setlocal
cd /d C:\dev\AngularProjectNF\shell
echo === SHELL TEST ===
call npx ng test --watch=false 2>&1
cd /d C:\dev\AngularProjectNF\mfe-projects
echo === MFE-PROJECTS TEST ===
call npx ng test --watch=false 2>&1
cd /d C:\dev\AngularProjectNF\mfe-reports
echo === MFE-REPORTS TEST ===
call npx ng test --watch=false 2>&1
cd /d C:\dev\AngularProjectNF\mfe-admin
echo === MFE-ADMIN TEST ===
call npx ng test --watch=false 2>&1
cd /d C:\dev\AngularProjectNF\mfe-governance
echo === MFE-GOVERNANCE TEST ===
call npx ng test --watch=false 2>&1
cd /d C:\dev\AngularProjectNF\shared-lib
echo === SHARED-LIB TEST ===
call npx ng test --watch=false 2>&1
cd /d C:\dev\AngularProjectNF\ui-lib
echo === UI-LIB TEST ===
call npx ng test --watch=false 2>&1
