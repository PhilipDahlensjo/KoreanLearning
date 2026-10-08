# Creates the MP3 files for the listening questions with Google Cloud Text-to-Speech.
# Run it once, and again after adding new listening questions.
#
# Usage (in the project folder):
#   powershell -ExecutionPolicy Bypass -File .\generate-audio.ps1
#
# The API key is asked for when the script starts (or read from the
# GOOGLE_TTS_API_KEY environment variable). It is never saved in the project.
# Files that already exist are skipped. Use -Force to create them again.

param(
  [string]$QuestionsFile = "data/hangul-questions.json",
  [string]$Voice = "ko-KR-Wavenet-A",
  [double]$SlowRate = 0.6,
  [switch]$Force
)

$ErrorActionPreference = "Stop"
$ApiUrl = "https://texttospeech.googleapis.com/v1/text:synthesize"

# Get the API key without showing it on screen or saving it in the terminal history
$apiKey = $env:GOOGLE_TTS_API_KEY
if (-not $apiKey) {
  $secureKey = Read-Host "Google Text-to-Speech API key" -AsSecureString
  $apiKey = [System.Net.NetworkCredential]::new("", $secureKey).Password
}
if (-not $apiKey) {
  throw "No API key was given."
}

# Asks Google to read the text out loud and saves the result as an MP3 file
function Save-Speech([string]$Text, [double]$Rate, [string]$RelativePath) {
  $path = Join-Path $PSScriptRoot $RelativePath
  if ((Test-Path $path) -and -not $Force) {
    Write-Host "Skipped $RelativePath (already exists)"
    return
  }

  $body = @{
    input       = @{ text = $Text }
    voice       = @{ languageCode = "ko-KR"; name = $Voice }
    audioConfig = @{ audioEncoding = "MP3"; speakingRate = $Rate }
  } | ConvertTo-Json -Depth 3

  $response = Invoke-RestMethod -Method Post -Uri $ApiUrl `
    -Headers @{ "X-Goog-Api-Key" = $apiKey } `
    -ContentType "application/json; charset=utf-8" `
    -Body ([System.Text.Encoding]::UTF8.GetBytes($body))

  New-Item -ItemType Directory -Force (Split-Path $path) | Out-Null
  [System.IO.File]::WriteAllBytes($path, [System.Convert]::FromBase64String($response.audioContent))
  Write-Host "Created $RelativePath"
}

$quiz = Get-Content (Join-Path $PSScriptRoot $QuestionsFile) -Raw -Encoding UTF8 | ConvertFrom-Json

foreach ($question in $quiz.questions) {
  if (-not $question.speak) {
    continue
  }
  if ($question.audio) {
    Save-Speech $question.speak 1.0 $question.audio
  }
  if ($question.audioSlow) {
    Save-Speech $question.speak $SlowRate $question.audioSlow
  }
}

Write-Host "Done."
