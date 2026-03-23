---
description: Game Dev Hub 기능 개발 시 따르는 표준 절차
---

# 개발 워크플로우

기능 추가/수정 시 아래 4단계를 순서대로 따른다.

// turbo-all

## 1. 최신 기술 검색 (context7)

- 사용 중인 프레임워크의 최신 문서를 context7으로 확인
- 새 라이브러리 도입 시 반드시 최신 버전/best practice 확인
- 예: `resolve-library-id: /vercel/next.js`

## 2. 전체 파이프라인 확인

- `app/ARCHITECTURE.md` 를 읽고 현재 시스템 구조 파악
- 수정 범위가 어떤 모듈에 영향을 미치는지 사전 분석
- 기존 타입(`src/types/`)과 상수(`src/constants/`) 재활용 여부 확인

## 3. 시스템 모듈화

- 새 기능이 기존 모듈 경계를 넘으면 적절히 분리
- 공통 유틸/컴포넌트는 반드시 `src/components/ui/` 또는 `src/lib/`에 배치
- 페이지 컴포넌트에 비즈니스 로직을 직접 넣지 않고 hooks/lib에 분리

## 4. 기존 컴포넌트 재활용

- `src/components/ui/` 의 공통 컴포넌트를 우선 사용
- 새 UI 패턴이 2곳 이상에서 쓰이면 공통 컴포넌트로 추출
- `ARCHITECTURE.md` 에 새로 추가된 모듈 반영

## 5. 검증 (RALPH 원칙)

```bash
cd "j:\AI\2인 게임 관리 툴\app"
npm run build
```

- 빌드 에러 0개 확인
- 에러 시 3회까지 자동 수정 반복
