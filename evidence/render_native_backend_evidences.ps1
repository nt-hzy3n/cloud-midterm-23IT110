Add-Type -AssemblyName System.Drawing

function Render-TerminalWindow {
    param (
        [string]$Title,
        [string[]]$Lines,
        [string]$OutputPath,
        [int]$CustomWidth = 920
    )

    $font = New-Object System.Drawing.Font("Consolas", 12, [System.Drawing.FontStyle]::Regular)
    $titleFont = New-Object System.Drawing.Font("Segoe UI", 10.5, [System.Drawing.FontStyle]::Regular)
    $margin = 24
    $topBarHeight = 44
    
    $measureBmp = New-Object System.Drawing.Bitmap(1, 1)
    $measureG = [System.Drawing.Graphics]::FromImage($measureBmp)
    $lineHeight = [int]($font.GetHeight($measureG) + 5)
    
    $maxWidth = $CustomWidth
    foreach ($line in $Lines) {
        $size = $measureG.MeasureString($line, $font)
        if ($size.Width + ($margin * 2) -gt $maxWidth) {
            $maxWidth = [int]($size.Width + ($margin * 2) + 20)
        }
    }
    $totalHeight = $topBarHeight + ($margin * 2) + ($lineHeight * $Lines.Length)
    $measureG.Dispose()
    $measureBmp.Dispose()

    $bmp = New-Object System.Drawing.Bitmap($maxWidth, $totalHeight)
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.TextRenderingHint = [System.Drawing.Text.TextRenderingHint]::ClearTypeGridFit
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality

    # Background
    $bgBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(30, 30, 30))
    $g.FillRectangle($bgBrush, 0, 0, $maxWidth, $totalHeight)

    # Top title bar
    $barBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(45, 45, 45))
    $g.FillRectangle($barBrush, 0, 0, $maxWidth, $topBarHeight)

    # macOS window controls
    $redBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(255, 95, 86))
    $yellowBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(255, 189, 46))
    $greenBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(39, 201, 63))
    $g.FillEllipse($redBrush, 16, 15, 14, 14)
    $g.FillEllipse($yellowBrush, 38, 15, 14, 14)
    $g.FillEllipse($greenBrush, 60, 15, 14, 14)

    # Window Title
    $titleBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(180, 180, 180))
    $titleFormat = New-Object System.Drawing.StringFormat
    $titleFormat.Alignment = [System.Drawing.StringAlignment]::Center
    $titleFormat.LineAlignment = [System.Drawing.StringAlignment]::Center
    $titleRect = New-Object System.Drawing.RectangleF(0, 0, $maxWidth, $topBarHeight)
    $g.DrawString($Title, $titleFont, $titleBrush, $titleRect, $titleFormat)

    # Color brushes
    $defaultBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(220, 220, 220))
    $commentBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(106, 153, 85))
    $keywordBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(86, 156, 214))
    $passBrush    = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(78, 201, 176))
    $stringBrush  = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(206, 145, 120))
    $functionBrush= New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(220, 220, 170))

    $y = $topBarHeight + $margin
    foreach ($line in $Lines) {
        $brush = $defaultBrush
        if ($line.Trim().StartsWith("//") -or $line.Trim().StartsWith("#")) {
            $brush = $commentBrush
        } elseif ($line.Trim().StartsWith("const ") -or $line.Trim().StartsWith("function ") -or $line.Trim().StartsWith("let ") -or $line.Trim().StartsWith("return ") -or $line.Trim().StartsWith("module.exports")) {
            $brush = $keywordBrush
        } elseif ($line.Contains("READ database connected") -or $line.Contains("WRITE database connected")) {
            $brush = $passBrush
        } elseif ($line.Contains("'mongodb'") -or $line.Contains("'DB_23IT110'")) {
            $brush = $stringBrush
        } elseif ($line.Contains("getReadDb") -or $line.Contains("getWriteDb") -or $line.Contains("connectDatabase")) {
            $brush = $functionBrush
        }

        $g.DrawString($line, $font, $brush, [float]$margin, [float]$y)
        $y += $lineHeight
    }

    $bmp.Save($OutputPath, [System.Drawing.Imaging.ImageFormat]::Png)
    $g.Dispose()
    $bmp.Dispose()
    Write-Host "Generated: $OutputPath"
}

# 1. 03-database-config.png
$dbLines = Get-Content -Path "config/database.js"
Render-TerminalWindow -Title "config/database.js - Native MongoClient Dual Connections (Read/Write)" `
    -Lines $dbLines `
    -OutputPath "evidence/02-backend/03-database-config.png" `
    -CustomWidth 920

# 2. 04-book-model.png
$modelLines = Get-Content -Path "models/Book.js"
Render-TerminalWindow -Title "models/Book.js - Native Document Helper (No Mongoose)" `
    -Lines $modelLines `
    -OutputPath "evidence/02-backend/04-book-model.png" `
    -CustomWidth 880

# 3. 05-book-controller.png
$controllerLines = Get-Content -Path "controllers/bookController.js"
Render-TerminalWindow -Title "controllers/bookController.js - Native MongoDB Read/Write Controller" `
    -Lines $controllerLines `
    -OutputPath "evidence/02-backend/05-book-controller.png" `
    -CustomWidth 940
