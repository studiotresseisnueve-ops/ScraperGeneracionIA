# Levanta los contenedores y muestra la URL de acceso en la red local

$localIP = (Get-NetIPAddress -AddressFamily IPv4 |
    Where-Object { $_.InterfaceAlias -notmatch "Loopback|WSL|vEthernet" -and $_.IPAddress -notlike "169.*" } |
    Sort-Object -Property PrefixLength -Descending |
    Select-Object -First 1).IPAddress

Write-Host ""
Write-Host "Levantando contenedores..." -ForegroundColor Cyan
docker compose up --build -d

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Green
    Write-Host "  App corriendo. Accede desde cualquier" -ForegroundColor Green
    Write-Host "  dispositivo en la misma red WiFi:"     -ForegroundColor Green
    Write-Host ""
    Write-Host "  http://$localIP" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "  (localhost desde esta maquina)"        -ForegroundColor Gray
    Write-Host "  http://localhost"                      -ForegroundColor Gray
    Write-Host "========================================" -ForegroundColor Green
    Write-Host ""
} else {
    Write-Host "Error al levantar los contenedores." -ForegroundColor Red
}
