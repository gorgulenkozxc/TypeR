if ($args -contains "--help") {
    Write-Host "Usage: install_win.ps1 [--mute] [--silent] [--help] [--yes]"
    Write-Host "Options:"
    Write-Host "  --mute: Suppress all messages"
    Write-Host "  --silent: Suppress all messages except errors"
    Write-Host "  --help: Show this help message"
    Write-Host "  --yes: Automatically answer 'yes' to prompts"
    exit
}

$IsMute = $args -contains "--mute"
$IsSilent = $args -contains "--silent" -or $IsMute
$AlwaysYes = $args -contains "--yes"

$ExecutionStartTime = Get-Date

# Get the current extension version
$ManifestContent = Get-Content "CSXS\manifest.xml" -Raw
$VersionMatch = [regex]::Match($ManifestContent, '<Extension Id="typer".*?Version="([^"]+)"')
if ($VersionMatch.Success) {
    $ExtensionVersion = $VersionMatch.Groups[1].Value
}
else {
    $ExtensionVersion = "unknown"
}

function Get-PhotoshopProcess {
    try {
        return Get-Process -Name "Photoshop" -ErrorAction Stop
    }
    catch {
        return $null
    }
}

function Write-Error {
    param (
        [string]$Message
    )

    if ($IsMute) {
        return
    }

    Write-Host "[-] $Message" -ForegroundColor Red
}

function Write-Warning {
    param (
        [string]$Message
    )

    if ($IsSilent) {
        return
    }

    Write-Host "[!] $Message" -ForegroundColor Yellow
}

function Write-Info {
    param (
        [string]$Message
    )

    if ($IsSilent) {
        return
    }

    Write-Host "[*] $Message" -ForegroundColor DarkGray
}

function Write-Success {
    param (
        [string]$Message
    )

    if ($IsSilent) {
        return
    }

    Write-Host "[+] $Message" -ForegroundColor Green
}

function Read-YesNo {
    param (
        [string]$Message,
        [switch]$defaultYes
    )

    if ($AlwaysYes) {
        return $true
    }

    $UserInput = Read-Host "$Message $(if ($defaultYes) { "(Y/n)" } else { "(y/N)" })"

    if ($UserInput -eq "") {
        return $defaultYes
    }

    return $UserInput -eq "y" -or $UserInput -eq "Y"
}

$PhotoshopExecutablePath = $null
$PhotoshopProcess = Get-PhotoshopProcess
# Wait for Photoshop to get closed if it's running
if ($PhotoshopProcess) {
    $PhotoshopExecutablePath = $PhotoshopProcess.Path

    Write-Error "Photoshop is currently running. Please close it before proceeding."
    Write-Info "Photoshop PID: $($PhotoshopProcess.Id). Process name: $($PhotoshopProcess.ProcessName)"

    $KillPhotoshop = Read-YesNo "Do you want to close Photoshop (Unsaved data probably will be discarded)?"

    if ($KillPhotoshop) {
        try {
            $PhotoshopProcess | Stop-Process -Force
            Write-Success "Photoshop has been closed. Continuing installation..."
        }
        catch {
            Write-Warning "Failed to close Photoshop. Please close it manually."
        }
    }
    else {
        Write-Warning "Installation aborted."
        exit
    }

    Start-Sleep -Seconds 2

    while (Get-PhotoshopProcess) {
        Start-Sleep -Seconds 1
    }

}

# If photoshop wasn't running, we can clear the host
if (-not $PhotoshopExecutablePath -and -not $IsSilent) {
    Clear-Host
}

Write-Warning "Installing Photoshop extension «TypeR v$ExtensionVersion»..."

Write-Info "Enabling PlayerDebugMode for CSXS versions 6-12..."
# Enable PlayerDebugMode for CSXS versions 6-12
6..12 | ForEach-Object {
    $KeyPath = "HKCU:\SOFTWARE\Adobe\CSXS.$_"
    if (Test-Path $KeyPath) {
        Set-ItemProperty -Path $KeyPath -Name "PlayerDebugMode" -Value "1" -Force
    }
}

$Directory = "$env:HOMEDRIVE$env:HOMEPATH\AppData\Roaming\Adobe\CEP\extensions\typertools"

Write-Info "Target directory: $Directory"
if (Test-Path "$Directory\storage") {
    Write-Info "Backing up existing storage directory..."
    Copy-Item "$Directory\storage" "__storage" -Force
}

if (Test-Path $Directory) {
    Write-Info "Removing existing directory..."
    Remove-Item $Directory -Recurse -Force
}

Write-Info "Creating new directory..."
New-Item -ItemType Directory -Path $Directory -Force | Out-Null

Write-Info "Copying files to $Directory..."
Copy-Item "app" "$Directory\app\" -Recurse -Force -Exclude ".gitignore"
Copy-Item "CSXS" "$Directory\CSXS\" -Recurse -Force -Exclude ".gitignore"
Copy-Item "icons" "$Directory\icons\" -Recurse -Force -Exclude ".gitignore"
Copy-Item "locale" "$Directory\locale\" -Recurse -Force -Exclude ".gitignore"
Copy-Item "themes" "$Directory\app\themes\" -Recurse -Force -Exclude ".gitignore"

if (Test-Path ".debug") {
    Write-Info "Copying debug files to $Directory..."
    Copy-Item ".debug" "$Directory\.debug" -Force
}

if (Test-Path "__storage") {
    Write-Info "Restoring storage directory..."
    Copy-Item "__storage" "$Directory\storage" -Force
    Remove-Item "__storage" -Force
}

$ExecutionDuration = Get-Date - $ExecutionStartTime

Write-Host
Write-Success "Installation completed."
Write-Warning "Open Photoshop and in the upper menu click the following: [Window] > [Extensions] > [TypeR]"
Write-Info ("Installed in {0:N2} seconds" -f $ExecutionDuration.TotalSeconds)
Write-Host
Write-Info "Many thanks to Swirt for TyperTools and SeanR & Sakushi for this fork."
Write-Info "ScanR's Discord if you need help: https://discord.com/invite/Pdmfmqk"
Write-Host

if ($PhotoshopExecutablePath) {
    $RunPhotoshop = Read-YesNo "Do you want to run Photoshop now?" $true
    if ($RunPhotoshop) {
        Write-Info "Starting Photoshop..."
        Start-Process -FilePath $PhotoshopExecutablePath
        Write-Success "Photoshop started successfully."
    }
    else {
        Write-Info "You can run Photoshop later to see the changes."
    }
}