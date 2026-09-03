while(\True) {
  \ = curl -s https://boozathink.com/api/services/insights/admin/clean-sep2
  echo \
  if (\ -match 'success') { break }
  Start-Sleep -Seconds 30
}
