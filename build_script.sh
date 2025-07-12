#!/bin/bash

# Get the current extension version
ManifestContent=$(cat "CSXS/manifest.xml")
if [[ $ManifestContent =~ \<Extension\ Id=\"typer\".*?Version=\"([^\"]+)\" ]]; then
    ExtensionVersion="${BASH_REMATCH[1]}"
else
    ExtensionVersion="unknown"
fi

Timestamp=$(date +"%Y%m%d%H%M%S")
TempDir="$(mktemp -d)/typertools_$Timestamp"

ArtifactPath="dist/typertools-$ExtensionVersion.zip"

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

# Create zip file
(cd "$(dirname "$TempDir")" && zip -r "$(pwd)/typertools_$Timestamp.zip" "typertools_$Timestamp")
mv "$(dirname "$TempDir")/typertools_$Timestamp.zip" "./$ArtifactPath"

# Clean up
rm -rf "$TempDir"

echo -e "Created $ArtifactPath successfully."
