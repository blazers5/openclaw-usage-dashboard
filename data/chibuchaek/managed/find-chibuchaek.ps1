param(
  [Parameter(Mandatory=$true)][string]$Query
)
$csvPath = Join-Path $PSScriptRoot 'chibuchaek_master.csv'
$rows = Import-Csv -Path $csvPath | Where-Object {
  $_.name -like "*$Query*" -or $_.category -like "*$Query*" -or $_.no -like "*$Query*"
}
if(-not $rows){
  Write-Output "검색결과 없음: $Query"
  exit 0
}
$rows | Select-Object no,name,amount,category,flag | Format-Table -AutoSize
