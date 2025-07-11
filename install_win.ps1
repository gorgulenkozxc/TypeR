$execution_start_time = Get-Date

# Get the current extension version
$manifestContent = Get-Content "CSXS\manifest.xml" -Raw
$versionMatch = [regex]::Match($manifestContent, '<Extension Id="typer".*?Version="([^"]+)"')
if ($versionMatch.Success) {
    $EXT_VERSION = $versionMatch.Groups[1].Value
}
else {
    $EXT_VERSION = "unknown"
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
        [string]$message
    )
    Write-Host "[-] $message" -ForegroundColor Red
}

function Write-Warning {
    param (
        [string]$message
    )
    Write-Host "[!] $message" -ForegroundColor Yellow
}

function Write-Info {
    param (
        [string]$message
    )
    Write-Host "[*] $message" -ForegroundColor DarkGray
}

function Write-Success {
    param (
        [string]$message
    )
    Write-Host "[+] $message" -ForegroundColor Green
}

$dont_clear = $false
# Wait for Photoshop to get closed if it's running
if (Get-PhotoshopProcess) {
    $process = (Get-PhotoshopProcess)
    $dont_clear = $true

    Clear-Host
    Write-Error "Photoshop is currently running. Please close it before proceeding."
    Write-Info "Photoshop PID: $($process.Id). Process name: $($process.ProcessName)"

    $user_input = Read-Host "Do you want to close Photoshop (Unsaved data probably will be discarded)? (y/N)"

    if ($user_input -eq "y" -or $user_input -eq "Y") {
        try {
            $process | Stop-Process -Force
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

if (-not $dont_clear) {
    Clear-Host
}
Write-Warning "Installing Photoshop extension «TypeR v$EXT_VERSION»..."

Write-Info "Enabling PlayerDebugMode for CSXS versions 6-12..."
# Enable PlayerDebugMode for CSXS versions 6-12
6..12 | ForEach-Object {
    $keyPath = "HKCU:\SOFTWARE\Adobe\CSXS.$_"
    if (Test-Path $keyPath) {
        Set-ItemProperty -Path $keyPath -Name "PlayerDebugMode" -Value "1" -Force
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

$execution_end_time = Get-Date
$execution_duration = $execution_end_time - $execution_start_time

Write-Host
Write-Success "Installation completed."
Write-Warning "Open Photoshop and in the upper menu click the following: [Window] > [Extensions] > [TypeR]"
Write-Info ("Installed in {0:N2} seconds" -f $execution_duration.TotalSeconds)
Write-Host
Write-Info "Many thanks to Swirt for TyperTools and SeanR & Sakushi for this fork."
Write-Info "ScanR's Discord if you need help: https://discord.com/invite/Pdmfmqk"
Write-Host

