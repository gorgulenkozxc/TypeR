# Get the current extension version
$ManifestContent = Get-Content "CSXS\manifest.xml" -Raw
$VersionMatch = [regex]::Match($ManifestContent, '<Extension Id="typer".*?Version="([^"]+)"')
if ($VersionMatch.Success) {
    $ExtensionVersion = $VersionMatch.Groups[1].Value
}
else {
    $ExtensionVersion = "unknown"
}

$Timestamp = Get-Date -Format "yyyyMMddHHmmss"
$TempDir = Join-Path -Path $([System.IO.Path]::GetTempPath()) -ChildPath "typertools_$Timestamp"

$ArtifactPath = "dist/typertools-$ExtensionVersion.zip"

If (Test-Path $ArtifactPath) {
    Write-Host "Removing old artifact: $ArtifactPath" -ForegroundColor Yellow
    Remove-Item $ArtifactPath -Force
}

Write-Host "Creating temporary directory: $TempDir" -ForegroundColor DarkGray

New-Item -Type Directory -Path $TempDir | Out-Null
New-Item -Type Dir $TempDir\\app | Out-Null
New-Item -Type Dir $TempDir\\CSXS | Out-Null
New-Item -Type Dir $TempDir\\icons | Out-Null
New-Item -Type Dir $TempDir\\locale | Out-Null
New-Item -Type Dir $TempDir\\app\\themes | Out-Null

Copy-Item .\\install_mac.sh $TempDir -force
Copy-Item .\\install_win.ps1 $TempDir -force
Copy-item .\\app\\* $TempDir\\app -force -recurse
Copy-item .\\CSXS\\* $TempDir\\CSXS -force -recurse
Copy-item .\\icons\\* $TempDir\\icons -force -recurse
Copy-item .\\locale\\* $TempDir\\locale -force -recurse
Copy-item .\\themes\\* $TempDir\\app\\themes -force -recurse

Compress-Archive -Path "$TempDir\*" -DestinationPath ".\$ArtifactPath"
Remove-Item $TempDir -force -recurse

Write-Host "Created $ArtifactPath successfully." -ForegroundColor Green