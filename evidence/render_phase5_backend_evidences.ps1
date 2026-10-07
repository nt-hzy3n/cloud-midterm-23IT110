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
    $tagBrush     = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(156, 220, 254))
    $mustacheBrush= New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(220, 220, 100))

    $y = $topBarHeight + $margin
    foreach ($line in $Lines) {
        $brush = $defaultBrush
        if ($line.Trim().StartsWith("//") -or $line.Trim().StartsWith("<!--")) {
            $brush = $commentBrush
        } elseif ($line.Trim().StartsWith("const ") -or $line.Trim().StartsWith("function ") -or $line.Trim().StartsWith("require") -or $line.Trim().StartsWith("module.exports")) {
            $brush = $keywordBrush
        } elseif ($line.Contains("{{") -or $line.Contains("}}")) {
            $brush = $mustacheBrush
        } elseif ($line.Trim().StartsWith("<") -and $line.Trim().EndsWith(">")) {
            $brush = $tagBrush
        } elseif ($line.Contains("'handlebars'") -or $line.Contains("'view engine'")) {
            $brush = $stringBrush
        }

        $g.DrawString($line, $font, $brush, [float]$margin, [float]$y)
        $y += $lineHeight
    }

    $bmp.Save($OutputPath, [System.Drawing.Imaging.ImageFormat]::Png)
    $g.Dispose()
    $bmp.Dispose()
    Write-Host "Generated: $OutputPath"
}

# 1. evidence/02-backend/10-handlebars-config.png
$serverLines = Get-Content -Path "server.js"
$configSlice = @(
    "// server.js - Express Handlebars View Engine Configuration",
    "const express = require('express');",
    "const path = require('path');",
    "const { engine } = require('express-handlebars');",
    "",
    "const app = express();",
    "",
    "// View engine setup (Handlebars)",
    "app.engine('handlebars', engine());",
    "app.set('view engine', 'handlebars');",
    "app.set('views', path.join(__dirname, 'views'));",
    "",
    "// Middleware setup",
    "app.use(express.urlencoded({ extended: true }));",
    "app.use(express.json());",
    "app.use(express.static(path.join(__dirname, 'public')));",
    "",
    "// Session middleware (MongoDB Atlas centralized store)",
    "app.use(configureSession());",
    "",
    "// Routes",
    "app.get('/', (req, res) => res.redirect('/books'));",
    "app.use('/books', bookRoutes);"
)
Render-TerminalWindow -Title "server.js - Express Handlebars View Engine Setup" `
    -Lines $configSlice `
    -OutputPath "evidence/02-backend/10-handlebars-config.png" `
    -CustomWidth 880

# 2. evidence/02-backend/11-book-template.png
$templateSlice = @(
    '<!-- views/books.handlebars (Table, VAT, & Empty State) -->',
    '{{#if success}}',
    '  <div class="alert alert-success">[OK] {{success}}</div>',
    '{{/if}}',
    '{{#if error}}',
    '  <div class="alert alert-error">! {{error}}</div>',
    '{{/if}}',
    '',
    '<!-- Data Table Rendering from MongoDB Atlas -->',
    '<tbody>',
    '  {{#if books.length}}',
    '    {{#each books}}',
    '      <tr>',
    '        <td><code>{{this.productCode}}</code></td>',
    '        <td>{{this.title}}</td>',
    '        <td>{{this.author}}</td>',
    '        <td>{{this.price}} VND</td>',
    '        <td>{{this.vatRate}}%</td>',
    '        <td><strong>{{this.priceAfterTax}} VND</strong></td>',
    '      </tr>',
    '    {{/each}}',
    '  {{else}}',
    '    <tr>',
    '      <td colspan="6" class="empty-state">',
    '        Chua co du lieu sach trong co so du lieu.',
    '      </td>',
    '    </tr>',
    '  {{/if}}',
    '</tbody>',
    '',
    '<!-- views/layouts/main.handlebars (Personalized Footer) -->',
    '<footer class="app-footer">',
    '  <div class="footer-content">',
    '    <p><strong>Ho ten:</strong> {{fullName}}</p>',
    '    <p><strong>MSSV:</strong> {{mssv}}</p>',
    '    <p><strong>VAT:</strong> {{vatRate}}%</p>',
    '  </div>',
    '</footer>'
)
Render-TerminalWindow -Title 'Handlebars Templates - views/books.handlebars & views/layouts/main.handlebars' `
    -Lines $templateSlice `
    -OutputPath 'evidence/02-backend/11-book-template.png' `
    -CustomWidth 920
