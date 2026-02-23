# CRON_CLEANUP_PROPOSAL.md

작성시각(KST): 2026-02-23

## 요약
- 전체 16개 중 활성 7개, 비활성 9개
- 즉시 정리 권장: 중복/레거시 비활성 9개
- 유지 권장: 현재 운영 중 7개

## 1) 삭제 승인 요청 (비활성 + 중복/레거시)
아래 9개는 현재 운영 체계와 중복되거나 과거 버전입니다.

1. bf3312c4-e5e7-4bf7-a768-583834385572 (Daily 8AM tech news briefing)
2. c0a89d62-b164-44b9-aa93-c5af5f4bee8c (Daily 8:05AM weather for Icheon Gwango-dong)
3. a62327d7-15f3-4d01-94c9-f1dc45e9f03e (Daily 8:03AM FX + stocks briefing)
4. ab2ab193-e046-43cc-94f4-1891b075cb37 (Sony Alpha A7V stock check 9/12/17)
5. 6c354468-824b-48e5-b60c-cd093cc189b5 (Hourly usage check)
6. a1679580-04a5-45dd-9f5b-311a5b33191b (Son Heung-min match record tracker)
7. 43ceb1d2-6c3a-482e-b53b-b438d3e28cb3 (weather duplicate)
8. 3d89eabc-3968-45fa-ab25-f07c2861d4a8 (weather duplicate)
9. 28157de6-80b2-4261-8453-6497f9561bbd (Stock hourly summary 55m)

## 2) 유지 권장 (현재 활성 운영)
1. a6704f91-f86a-4aa4-b65f-ab969fc0b724 (Sony A7V rapid stock watch)
2. deaca03b-d253-4c48-911c-e3d1adc9ce20 (세션 95% 감시)
3. e243ec8f-5eaf-40af-baf2-8facf1ed7001 (Daily token/API usage report)
4. ee56c4bf-c51a-4b61-9386-b26ded3e679b (Daily 8:10 consolidated morning briefing)
5. ca8c9167-91df-4d1a-b0db-7c08d8302b79 (Son fixture daily check)
6. da75ddcc-7877-48b7-acdb-058016004c70 (Weekday KR market open stock refresh)
7. 19b2a2e6-6ce6-43da-81b5-45ecc358b449 (Weekly usage summary)

## 3) 실행 계획(승인 후)
- Step 1: 삭제 승인 9개 일괄 remove
- Step 2: 유지 8개는 설정 스냅샷 저장
- Step 3: 24시간 오류 모니터링 후 추가 튜닝 제안

## 승인 문구
- "승인: 삭제 9개 진행"
- "보류: ID ... 제외"
