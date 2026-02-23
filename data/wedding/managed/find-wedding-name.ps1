param(
  [Parameter(Mandatory=$true)][string]$Name
)
$csvPath = Join-Path $PSScriptRoot 'wedding_roster_master.csv'
$rows = Import-Csv -Path $csvPath | Where-Object { $_.이름 -like "*$Name*" }
if(-not $rows){
  Write-Output "검색결과 없음: $Name"
  exit 0
}
$rows | Select-Object 번호,이름,금액 | Format-Table -AutoSize
