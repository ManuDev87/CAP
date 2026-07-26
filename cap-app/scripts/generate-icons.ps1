# Generates all PWA icons from the legacy cap_exam_icon.png (640x640)
Add-Type -AssemblyName System.Drawing

$root   = Split-Path -Parent $PSScriptRoot
$source = Join-Path $root "..\examen-web\img\cap_exam_icon.png"
$icons  = Join-Path $root "public\icons"
$appDir = Join-Path $root "src\app"

New-Item -ItemType Directory -Path $icons -Force | Out-Null

function Resize-Icon($src, $size, $outPath) {
    $bmp = New-Object System.Drawing.Bitmap $size, $size
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
    $g.DrawImage($src, 0, 0, $size, $size)
    $bmp.Save($outPath, [System.Drawing.Imaging.ImageFormat]::Png)
    $g.Dispose(); $bmp.Dispose()
    Write-Output "icon -> $outPath ($size x $size)"
}

function Maskable-Icon($src, $size, $outPath) {
    # Maskable: brand-green full bleed background + icon scaled to 80% (safe zone)
    $bmp = New-Object System.Drawing.Bitmap $size, $size
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
    $brush = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(10, 132, 66))
    $g.FillRectangle($brush, 0, 0, $size, $size)
    $inner = [int]($size * 0.8)
    $offset = [int](($size - $inner) / 2)
    $g.DrawImage($src, $offset, $offset, $inner, $inner)
    $bmp.Save($outPath, [System.Drawing.Imaging.ImageFormat]::Png)
    $g.Dispose(); $bmp.Dispose(); $brush.Dispose()
    Write-Output "maskable -> $outPath ($size x $size)"
}

$img = [System.Drawing.Image]::FromFile($source)

Resize-Icon  $img 192 (Join-Path $icons "icon-192.png")
Resize-Icon  $img 512 (Join-Path $icons "icon-512.png")
Resize-Icon  $img 180 (Join-Path $icons "apple-touch-icon.png")
Resize-Icon  $img 256 (Join-Path $appDir "icon.png")
Maskable-Icon $img 512 (Join-Path $icons "maskable-512.png")

$img.Dispose()
Write-Output "Done."
