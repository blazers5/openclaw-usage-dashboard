# 개발 티켓 보드 (MVP)

## Must
- [x] T-001 데이터 스키마 확정 (`data/sentences.json`)
  - AC: id/category/jp/ko/pron 필드 검증
- [x] T-002 문장 카드 UI
  - AC: 원문/뜻/발음 토글 노출
- [x] T-003 이전/다음 네비게이션
  - AC: 순환 이동
- [x] T-004 오디오 재생(TTS)
  - AC: ja-JP 재생, 실패 시 안내
- [x] T-005 즐겨찾기
  - AC: 저장/해제, 새로고침 유지
- [x] T-006 즐겨찾기 필터
  - AC: 토글 시 목록 반영
- [x] T-007 퀴즈 v1
  - AC: 4지선다, 점수 표시
- [x] T-008 반응형 레이아웃
  - AC: 390px 모바일 화면 사용 가능

## Should
- [x] T-009 카테고리 탭
- [x] T-010 검색(일본어/한국어)
- [x] T-011 설정(발음 표시 기본값, 재생속도)

## Could
- [ ] T-012 학습 통계 위젯
- [ ] T-013 온보딩 3스텝

## Ops/QA
- [x] T-014 기본 QA 체크리스트 문서화 (`QA_CHECKLIST.md`)
- [x] T-015 README 정비 (실행/구조/기능/데이터)

## 공통 Definition of Done
- 동작 확인(Chrome/Edge)
- 콘솔 에러 없음
- README 업데이트
