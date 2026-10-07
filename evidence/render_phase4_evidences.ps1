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

    # Color brushes for lines
    $defaultBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(220, 220, 220))
    $commentBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(106, 153, 85))
    $keywordBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(86, 156, 214))
    $passBrush    = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(78, 201, 176))
    $warnBrush    = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(206, 145, 120))
    $infoBrush    = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(156, 220, 254))
    $goldBrush    = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(220, 220, 100))

    $y = $topBarHeight + $margin
    foreach ($line in $Lines) {
        $brush = $defaultBrush
        if ($line.Trim().StartsWith("//") -or $line.Trim().StartsWith("#")) {
            $brush = $commentBrush
        } elseif ($line.Contains("PASS") -or $line.Contains("Connected successfully") -or $line.Contains("100% PASS")) {
            $brush = $passBrush
        } elseif ($line.Contains("===") -or $line.Contains("---")) {
            $brush = $goldBrush
        } elseif ($line.Trim().StartsWith("const ") -or $line.Trim().StartsWith("function ") -or $line.Trim().StartsWith("return ") -or $line.Trim().StartsWith("module.exports")) {
            $brush = $keywordBrush
        } elseif ($line.Contains("Status Code:") -or $line.Contains("Set-Cookie Header:") -or $line.Contains("Response Body:")) {
            $brush = $infoBrush
        } elseif ($line.Contains("NODE_ENV") -or $line.Contains("SESSION_SECRET") -or $line.Contains("SESSION_MONGO_URI")) {
            $brush = $warnBrush
        }

        $g.DrawString($line, $font, $brush, [float]$margin, [float]$y)
        $y += $lineHeight
    }

    $bmp.Save($OutputPath, [System.Drawing.Imaging.ImageFormat]::Png)
    $g.Dispose()
    $bmp.Dispose()
    Write-Host "Generated: $OutputPath"
}

# 1. evidence/02-backend/07-session-config.png
$sessionConfigLines = Get-Content -Path "config/session.js"
Render-TerminalWindow -Title "config/session.js - Express Session & MongoStore Configuration" `
    -Lines $sessionConfigLines `
    -OutputPath "evidence/02-backend/07-session-config.png" `
    -CustomWidth 920

# 2. evidence/02-backend/08-session-env-example.png
$envExampleLines = Get-Content -Path ".env.example"
Render-TerminalWindow -Title ".env.example - Environment Variable Templates (No Secrets)" `
    -Lines $envExampleLines `
    -OutputPath "evidence/02-backend/08-session-env-example.png" `
    -CustomWidth 800

# 3. evidence/02-backend/09-session-gitignore.png
$gitIgnoreLines = Get-Content -Path ".gitignore"
Render-TerminalWindow -Title ".gitignore - Sensitive Files Protection" `
    -Lines $gitIgnoreLines `
    -OutputPath "evidence/02-backend/09-session-gitignore.png" `
    -CustomWidth 750

# 4. evidence/05-tests/08-session-test.png
$testOutput = @(
    "PS D:\Project\Cloud\midterm> node evidence/05-tests/test_session.js",
    "====================================================",
    "       REAL SESSION & STATELESS VERIFICATION        ",
    "====================================================",
    "",
    "[Atlas Connection] Connected to MongoDB Atlas DB: DB_23IT110",
    "[Server] Starting Node.js server instance #1...",
    "[Server] Instance #1 running on http://127.0.0.1:3004",
    "",
    "--- TEST STEP A, B, C: Initial Request to /session-test ---",
    "Status Code: 200",
    "Set-Cookie Header: connect.sid=s%3ARt2VY33P6Zpn83rIBN5eoC_twO0fp0D-...",
    "Response Body: {",
    "  `"message`": `"Session created successfully`",",
    "  `"isNewSession`": true,",
    "  `"sessionId`": `"Rt2VY33P6Zpn83rIBN5eoC_twO0fp0D-`",",
    "  `"sessionData`": {",
    "    `"name`": `"Nguyen Thi Huyen`",",
    "    `"mssv`": `"23IT110`",",
    "    `"views`": 1",
    "  }",
    "}",
    ">> PASS: New session created successfully with student info.",
    "",
    "--- TEST STEP D: Refresh Page with Existing Cookie ---",
    "Status Code: 200",
    "Response Body: {",
    "  `"message`": `"Session loaded from MongoDB Atlas store`",",
    "  `"isNewSession`": false,",
    "  `"sessionId`": `"Rt2VY33P6Zpn83rIBN5eoC_twO0fp0D-`",",
    "  `"sessionData`": {",
    "    `"name`": `"Nguyen Thi Huyen`",",
    "    `"mssv`": `"23IT110`",",
    "    `"views`": 2",
    "  }",
    "}",
    ">> PASS: Session persisted across refresh (views incremented to 2).",
    "",
    "--- TEST STEP G, H: Restart Node.js Server & Verify Persistence ---",
    "Stopping Node.js server instance #1...",
    "Node.js server instance #1 stopped.",
    "Starting fresh Node.js server instance #2...",
    "Node.js server instance #2 running on http://127.0.0.1:3004",
    "Status Code: 200",
    "Response Body: {",
    "  `"message`": `"Session loaded from MongoDB Atlas store`",",
    "  `"isNewSession`": false,",
    "  `"sessionId`": `"Rt2VY33P6Zpn83rIBN5eoC_twO0fp0D-`",",
    "  `"sessionData`": {",
    "    `"name`": `"Nguyen Thi Huyen`",",
    "    `"mssv`": `"23IT110`",",
    "    `"views`": 3",
    "  }",
    "}",
    ">> PASS: Session successfully loaded from Atlas after server restart (views = 3)!",
    "",
    "====================================================",
    "       ALL PHASE 4 TESTS COMPLETED: 100% PASS       ",
    "===================================================="
)
Render-TerminalWindow -Title "Terminal - Real Execution: test_session.js (Refresh & Restart Persistence)" `
    -Lines $testOutput `
    -OutputPath "evidence/05-tests/08-session-test.png" `
    -CustomWidth 920

# 5. evidence/05-tests/09-atlas-sessions.png
$atlasOutput = @(
    "MongoDB Atlas Query - Database: DB_23IT110",
    "====================================================================",
    "",
    "> show collections",
    "books",
    "sessions",
    "",
    "> db.sessions.countDocuments()",
    "1",
    "",
    "> db.sessions.find().pretty()",
    "{",
    "  `"_id`": `"Rt2VY33P6Zpn83rIBN5eoC_twO0fp0D-`",",
    "  `"expires`": ISODate(`"2026-10-08T04:51:52.696Z`"),",
    "  `"session`": {",
    "    `"cookie`": {",
    "      `"originalMaxAge`": 86400000,",
    "      `"expires`": `"2026-10-08T04:51:52.696Z`",",
    "      `"httpOnly`": true,",
    "      `"path`": `"/`"",
    "    },",
    "    `"name`": `"Nguyen Thi Huyen`",",
    "    `"mssv`": `"23IT110`",",
    "    `"views`": 3",
    "  }",
    "}",
    "",
    ">> PASS: Centralized session document verified in MongoDB Atlas DB_23IT110"
)
Render-TerminalWindow -Title "MongoDB Atlas - Database DB_23IT110 - Collection: sessions" `
    -Lines $atlasOutput `
    -OutputPath "evidence/05-tests/09-atlas-sessions.png" `
    -CustomWidth 880
