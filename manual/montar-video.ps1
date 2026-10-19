$ErrorActionPreference = "Stop"
$font = "C:/Windows/Fonts/arial.ttf"
$fontBold = "C:/Windows/Fonts/arialbd.ttf"
$shots = "$env:LOCALAPPDATA\Temp\cursor\screenshots"
$work = "c:\Projetos\futebolzinho\manual\tmp"
$out = "c:\Projetos\futebolzinho\manual\como-marcar-uma-partida.mp4"
New-Item -ItemType Directory -Force -Path $work | Out-Null

$texto = [System.Text.Encoding]::GetEncoding(1252)
function Save-Text($name, $value) {
  [System.IO.File]::WriteAllText((Join-Path $work $name), $value, $texto)
}

Save-Text "t-titulo.txt" "Como criar a partida e marcar o jogo"
Save-Text "t-sub.txt" "Futebol de quinta"
Save-Text "c1.txt" "1. Abra Nova Partida e confira a data e o local"
Save-Text "c2.txt" "2. Monte os times. Depois toque em Salvar partida"
Save-Text "c3.txt" "3. Na partida em aberto, toque em Tela cheia"
Save-Text "c4.txt" "4. Verde soma gol. Amarelo, assistencia. Vermelho, gol contra"
Save-Text "c5.txt" "5. Segure o nome por 3 segundos para corrigir"
Save-Text "c6.txt" "6. Para encerrar, escolha o melhor da partida"
Save-Text "t-fim.txt" "O que foi marcado fica salvo"

function CaptionFilter($textFile, $size, $y) {
  $path = ((Join-Path $work $textFile) -replace '\\','/' -replace ':','\:')
  $fontPath = $fontBold -replace ':','\:'
  return "drawtext=fontfile='${fontPath}':textfile='${path}':fontcolor=white:fontsize=${size}:x=(w-text_w)/2:y=${y}"
}

function FrameFilter($textFile) {
  $cap = CaptionFilter $textFile 30 22
  return "scale=1180:640:force_original_aspect_ratio=decrease,pad=1280:720:(ow-iw)/2:78:color=0x0f1c33,drawbox=x=0:y=0:w=1280:h=70:color=0x0f1c33:t=fill,${cap}"
}

function Make-Still($inputArgs, $filter, $seconds, $dest) {
  $args = @("-y") + $inputArgs + @(
    "-vf", $filter,
    "-t", "$seconds",
    "-r", "30",
    "-pix_fmt", "yuv420p",
    "-an",
    $dest
  )
  & ffmpeg @args
  if ($LASTEXITCODE -ne 0) { throw "ffmpeg falhou em $dest" }
}

$titulo = "$(CaptionFilter 't-titulo.txt' 42 300),$(CaptionFilter 't-sub.txt' 28 370)"
Make-Still @("-f","lavfi","-i","color=c=0x0f1c33:s=1280x720:r=30") $titulo 4 (Join-Path $work "00.mp4")

$frames = @(
  @{ img = "manual-01-nova-partida.png"; cap = "c1.txt"; sec = 5 },
  @{ img = "manual-02-times.png"; cap = "c2.txt"; sec = 6 },
  @{ img = "manual-03-lista.png"; cap = "c3.txt"; sec = 5 },
  @{ img = "manual-04-marcacao.png"; cap = "c4.txt"; sec = 6 },
  @{ img = "manual-05-corrigir.png"; cap = "c5.txt"; sec = 6 },
  @{ img = "manual-06-encerrar.png"; cap = "c6.txt"; sec = 6 }
)
$i = 1
foreach ($frame in $frames) {
  $dest = Join-Path $work ("{0:D2}.mp4" -f $i)
  Make-Still @("-loop","1","-i",(Join-Path $shots $frame.img)) (FrameFilter $frame.cap) $frame.sec $dest
  $i++
}

$fim = CaptionFilter "t-fim.txt" 36 330
Make-Still @("-f","lavfi","-i","color=c=0x0f1c33:s=1280x720:r=30") $fim 4 (Join-Path $work "07.mp4")

$list = Join-Path $work "lista.txt"
$lines = 0..7 | ForEach-Object { "file '{0:D2}.mp4'" -f $_ }
[System.IO.File]::WriteAllLines($list, $lines, $texto)

& ffmpeg -y -f concat -safe 0 -i $list -c copy (Join-Path $work "mudo.mp4")
if ($LASTEXITCODE -ne 0) { throw "concat falhou" }

& ffmpeg -y -i (Join-Path $work "mudo.mp4") -f lavfi -i "anullsrc=channel_layout=stereo:sample_rate=44100" -c:v copy -c:a aac -shortest $out
if ($LASTEXITCODE -ne 0) { throw "audio falhou" }

Get-Item $out | Select-Object FullName, Length
