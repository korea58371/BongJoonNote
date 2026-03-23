# Game Dev Hub — 시스템 아키텍처

> 이 문서는 프로젝트 구조를 요약합니다. 기능 추가 시 반드시 참조하세요.

## 기술 스택

| 항목 | 기술 |
|---|---|
| 프레임워크 | Next.js 16 (App Router, Turbopack) |
| 언어 | TypeScript |
| 스타일 | Tailwind CSS |
| 마크다운 | react-markdown |
| 데이터 | 로컬 JSON 파일 (AI가 직접 수정 가능) |

## 디렉토리 구조

```
app/
├── data/                    # 📦 로컬 JSON 데이터 저장소
│   ├── meetings.json
│   ├── ideas.json
│   └── tasks.json
├── src/
│   ├── types/               # 📐 전역 타입 정의
│   │   └── index.ts         #    Meeting, Idea, Task, Priority, Status 등
│   ├── constants/           # 🔧 전역 상수
│   │   └── index.ts         #    팀 멤버, 카테고리, 상태 설정, 스타일 클래스
│   ├── lib/                 # ⚙️ 유틸리티
│   │   ├── api.ts           #    클라이언트 API (제네릭 CRUD 팩토리)
│   │   ├── api-handler.ts   #    서버 API 핸들러 (제네릭 CRUD)
│   │   └── data.ts          #    JSON 파일 읽기/쓰기
│   ├── components/          # 🧩 공통 컴포넌트
│   │   ├── Sidebar.tsx      #    사이드바 (모바일 슬라이드 오버레이)
│   │   ├── Modal.tsx        #    범용 모달
│   │   └── ui/              #    (확장 예정) 공통 UI 프리미티브
│   └── app/                 # 📄 페이지 및 API Routes
│       ├── layout.tsx       #    루트 레이아웃 (사이드바 + 모바일 헤더)
│       ├── globals.css      #    다크 테마 + 커스텀 컬러
│       ├── page.tsx         #    대시보드
│       ├── meetings/        #    회의록 (마크다운 렌더링, 인라인 편집)
│       ├── ideas/           #    아이디어 보드 (카테고리 필터, 탭별 추가)
│       ├── tasks/           #    태스크 칸반 (드래그 앤 드롭)
│       └── api/             #    REST API Routes
│           ├── meetings/    #    GET, POST, PUT, DELETE
│           ├── ideas/
│           └── tasks/
```

## 데이터 흐름

```
[사용자] ←→ [Next.js 페이지] ←→ [API Routes] ←→ [data/*.json]
                                                       ↑
                                              [Antigravity AI 직접 수정]
```

## 모듈 규칙

1. **타입**: `src/types/index.ts`에서 정의, 모든 곳에서 `@/types`로 import
2. **상수**: `src/constants/index.ts`에서 관리 (팀 멤버, 카테고리, 스타일 등)
3. **API 클라이언트**: `src/lib/api.ts`의 제네릭 CRUD 팩토리 사용
4. **서버 핸들러**: `src/lib/api-handler.ts`의 제네릭 CRUD 핸들러 사용
5. **새 컬렉션 추가 시**: types → constants → api-handler route → api client → page 순서

## 반응형 기준

| 브레이크포인트 | 동작 |
|---|---|
| < lg (1024px) | 사이드바 숨김 (햄버거 메뉴), 칸반 세로 스택, 폼 1열 |
| ≥ lg | 사이드바 고정, 칸반 3열, 폼 다열 |

## 기능 목록

| 기능 | 상태 | 비고 |
|---|---|---|
| 대시보드 | ✅ | 통계, 진행률, 최근 활동 |
| 회의록 CRUD | ✅ | 인라인 편집, 마크다운 |
| 아이디어 보드 | ✅ | 카테고리 필터, 탭별 추가 |
| 태스크 칸반 | ✅ | 드래그 앤 드롭, 모바일 버튼 폴백 |
| 모바일 대응 | ✅ | 사이드바 오버레이, 반응형 그리드 |
