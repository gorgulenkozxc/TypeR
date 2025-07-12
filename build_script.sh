#!/bin/bash

# Get the current extension version
ExtensionVersion=$(grep -oP '<Extension Id="typer"[^>]*Version="\K[^"]+' CSXS/manifest.xml | head -n1)
if [ -z "$ExtensionVersion" ]; then
    ExtensionVersion="unknown"
fi

Timestamp=$(date +"%d.%m.%Y_%H%M%S")
TempDir="$(mktemp -d)/typertools_$Timestamp"

ArtifactPath="typertools_$ExtensionVersion.zip"
mkdir -p "$(dirname "$ArtifactPath")"

if [ -f "$ArtifactPath" ]; then
    echo -e "Removing old artifact: $ArtifactPath"
    rm -f "$ArtifactPath"
fi

echo -e "Creating temporary directory: $TempDir"

mkdir -p "$TempDir/app"
mkdir -p "$TempDir/CSXS"
mkdir -p "$TempDir/icons"
mkdir -p "$TempDir/locale"
mkdir -p "$TempDir/app/themes"

cp -f ./install_mac.sh "$TempDir/"
cp -f ./install_win.ps1 "$TempDir/"
cp -rf ./app/* "$TempDir/app/"
cp -rf ./CSXS/* "$TempDir/CSXS/"
cp -rf ./icons/* "$TempDir/icons/"
cp -rf ./locale/* "$TempDir/locale/"
cp -rf ./themes/* "$TempDir/app/themes/"

zip -r "$ArtifactPath" "$TempDir"
rm -rf "$TempDir"

echo -e "Created $ArtifactPath successfully."
