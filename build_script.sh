#!/bin/bash

# Get the current extension version
ManifestContent=$(cat "CSXS/manifest.xml")
if [[ $ManifestContent =~ \<Extension\ Id=\"typer\".*?Version=\"([^\"]+)\" ]]; then
    ExtensionVersion="${BASH_REMATCH[1]}"
else
    ExtensionVersion="unknown"
fi

Timestamp=$(date +"%d.%m.%Y_%H%M%S")
TempDir="$(mktemp -d)/typertools_$Timestamp"

ArtifactPath="dist/typertools_$ExtensionVersion.zip"
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

# Create zip file
(cd "$(dirname "$TempDir")" && zip -r "typertools_$Timestamp.zip" "$TempDir")
mv "typertools_$Timestamp.zip" "./$ArtifactPath"

# Clean up
rm -rf "$TempDir"
rm "typertools_$Timestamp.zip"

echo -e "Created $ArtifactPath successfully."
