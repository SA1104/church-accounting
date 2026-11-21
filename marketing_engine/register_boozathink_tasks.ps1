# Registers the 4 isolated BoozaThink daily KST marketing tasks in Windows Task Scheduler.
# Zero overlap with KoreaThink_* or SAThink_* tasks!
# Run in PowerShell when ready to activate automatic daily scheduling:
#   powershell -ExecutionPolicy Bypass -File .\marketing_engine\register_boozathink_tasks.ps1

$ErrorActionPreference = "Stop"
$PythonExe = (Get-Command python).Source
$ScriptPath = "c:\Users\new-s\OneDrive\Desktop\Boozathink\marketing_engine\boozathink_4slot_scheduler.py"
$WorkDir = "c:\Users\new-s\OneDrive\Desktop\Boozathink\marketing_engine"

$Slots = @(
  @{ Name = "BoozaThink_Daily_Drip_0820_Morning";   Time = "08:20"; Arg = "--slot morning --live" },
  @{ Name = "BoozaThink_Daily_Drip_1215_Lunch";     Time = "12:15"; Arg = "--slot lunch --live" },
  @{ Name = "BoozaThink_Daily_Drip_1515_Breaktime"; Time = "15:15"; Arg = "--slot breaktime --live" },
  @{ Name = "BoozaThink_Daily_Drip_2230_Night";     Time = "22:30"; Arg = "--slot night_shorts --live" }
)

foreach ($s in $Slots) {
  $Action = New-ScheduledTaskAction -Execute $PythonExe -Argument "`"$ScriptPath`" $($s.Arg)" -WorkingDirectory $WorkDir
  $Trigger = New-ScheduledTaskTrigger -Daily -At $s.Time
  $Settings = New-ScheduledTaskSettingsSet -StartWhenAvailable -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries
  Register-ScheduledTask -TaskName $s.Name -Action $Action -Trigger $Trigger -Settings $Settings -Force | Out-Null
  Write-Host "[Registered] $($s.Name) at $($s.Time) KST"
}
