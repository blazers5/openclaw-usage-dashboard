param(
  [Parameter(Mandatory=$true)][string]$Name
)
$csvPath = Join-Path $PSScriptRoot 'people_ledger_master.csv'
$rows = Import-Csv -Path $csvPath | Where-Object { $_.name -like "*$Name*" }
if(-not $rows){
  Write-Output "검색결과 없음: $Name"
  exit 0
}
$rows | Select-Object source,no,name,amount,category,flag | Format-Table -AutoSize
