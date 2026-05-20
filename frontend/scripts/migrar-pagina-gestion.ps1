param(
  [Parameter(Mandatory = $true)][string]$RutaArchivo,
  [Parameter(Mandatory = $true)][string]$ClaseSeccion,
  [string]$AriaLabelledby = ''
)

$c = Get-Content $RutaArchivo -Raw -Encoding UTF8
$patSeccion = '<section class="' + [regex]::Escape($ClaseSeccion) + '"'
if ($c -notmatch $patSeccion) {
  Write-Error "No se encontró section.$ClaseSeccion en $RutaArchivo"
  exit 1
}

$c = $c -replace $patSeccion, '<section class="pg-wrap"'
if ($AriaLabelledby) {
  $c = $c -replace '(<section class="pg-wrap"[^>]*>)', "`$1`r`n    <div class=`"pg-marco`">"
} else {
  $c = $c -replace '(<section class="pg-wrap")', '<section class="pg-wrap"'
  $c = $c -replace '(<section class="pg-wrap"[^>]*>\s*)', "`$1    <div class=`"pg-marco`">`r`n"
}

$map = @{
  "${ClaseSeccion}-cab" = 'pg-cab'
  "${ClaseSeccion}-cab-izq" = 'pg-cab-izq'
  "${ClaseSeccion}-ico" = 'pg-cab-ico'
  "${ClaseSeccion}-titulo" = 'pg-titulo'
  "${ClaseSeccion}-tit" = 'pg-titulo'
  "${ClaseSeccion}-sub" = 'pg-sub'
  "${ClaseSeccion}-barra" = 'pg-barra'
  "${ClaseSeccion}-barra-col" = 'pg-barra-col'
  "${ClaseSeccion}-etq-bl" = 'pg-filtro-bl'
  "${ClaseSeccion}-etiqueta" = 'pg-filtro-etiq'
  "${ClaseSeccion}-inp" = 'pg-filtro-inp'
  "${ClaseSeccion}-resumen" = 'pg-resumen pg-resumen--flex'
  "${ClaseSeccion}-tab-wrap" = 'pg-tabla-cuerpo'
  "${ClaseSeccion}-tabla" = 'pg-tabla pg-tabla--estado'
}

foreach ($k in $map.Keys) {
  $c = $c -replace [regex]::Escape($k), $map[$k]
}

# Botones reset comunes
$c = $c -replace "${ClaseSeccion}-btn-sec ${ClaseSeccion}-btn-reset", 'pg-btn-reset-filtros'
$c = $c -replace 'class="stk-btn-sec stk-btn-reset"', 'class="pg-btn-reset-filtros"'

# Cabecera con icono: envolver en pg-cab-txt si falta
if ($c -match 'class="pg-cab-izq"' -and $c -notmatch 'class="pg-cab-txt"') {
  $c = $c -replace '(<header class="pg-cab">)\s*(<motion.div class="pg-cab-izq">)', '$1`n      <div class="pg-cab-txt">`n        $2'
}

Set-Content $RutaArchivo $c -Encoding UTF8 -NoNewline
Write-Host "Migrado: $RutaArchivo ($ClaseSeccion -> pg-*)"
