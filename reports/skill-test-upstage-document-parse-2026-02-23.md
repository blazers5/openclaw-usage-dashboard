# HWP 파싱 스킬 테스트 리포트 (upstage-document-parse)

- 테스트 시각(KST): 2026-02-23
- 스킬: `upstage-document-parse`
- 설치 경로: `skills/upstage-document-parse`
- 상태: **Missing requirements** (UPSTAGE_API_KEY 미설정)

## 연결/인식 테스트
- `openclaw skills check`에서 `📑 upstage-document-parse` 인식 확인
- `openclaw skills info upstage-document-parse` 조회 성공
- 요구사항 확인:
  - Binary: `curl` ✅
  - Environment: `UPSTAGE_API_KEY` ❌ (없음)

## 보안 점검
- 설치 시 ClawHub 경고: "suspicious" 플래그로 `--force` 필요
- 상세 스캔 문구 확인 결과:
  - OpenClaw 스캔: **Benign (high confidence)**
  - 주의점: 문서를 외부 API(Upstage)로 업로드 처리하므로 데이터 외부 전송 발생
- 판단: **코드 위험도는 낮아 보이나, 민감문서 업로드 정책 확인 필수**

## 기능 테스트 결과
- API 키 미설정으로 실제 파싱 호출(E2E) 테스트는 불가
- 결론: 설치/인식은 성공, 실사용 테스트는 키 연결 후 가능

## 권고
1. `UPSTAGE_API_KEY`를 안전하게 설정 후 재테스트
2. 테스트 문서는 비민감 샘플 파일로 시작
3. 운영 전 문서 반출 정책(개인정보/사내문서) 승인 필요
