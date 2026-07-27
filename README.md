# IronMan

트라이애슬론(러닝·수영·사이클) 훈련 기록 앱. Expo SDK 57 + TypeScript.
운동 기록은 기기 내 SQLite에 저장되고, AI 코칭은 Anthropic API를 직접 호출한다.
모든 날짜·시간은 KST(UTC+9) 기준이다.

---

## 1. 평소 사용 — preview 빌드

앱에 JS가 내장돼 있어 **PC 없이 단독 실행된다.** 네트워크 조건도 없다.

**코드를 고친 뒤 폰에 반영하기:**

```bash
eas update --branch preview
```

앱을 완전히 종료했다가 다시 켜면 적용된다. 재설치는 필요 없다.

**APK를 다시 빌드해야 하는 경우** — 아래에 해당할 때만:

- 네이티브 패키지 추가·제거 (`expo-*`, `react-native-*` 중 네이티브 코드가 있는 것)
- 앱 아이콘·스플래시 이미지 변경
- `app.json`의 plugins, package name, permissions 변경

```bash
eas build --profile preview --platform android
```

완성된 APK는 기존 앱 위에 덮어쓰기 설치한다. 서명이 같으므로 앱을 지울 필요가 없고,
지우면 운동 기록과 API 키가 함께 사라진다.

---

## 2. 핫리로드로 개발할 때 — development 빌드

저장 즉시 폰에 반영되는 방식. `--profile development`로 빌드한 APK가 설치돼 있어야 한다.

```bash
npm start              # PC와 폰이 같은 Wi-Fi일 때
npm run start:tunnel   # 다른 네트워크일 때
```

터미널의 QR코드를 앱에서 스캔한다.

`start:tunnel`은 Expo 터널(ngrok)을 경유해 인터넷으로 우회하므로 네트워크가 달라도 연결된다.
최초 실행 시 `@expo/ngrok` 설치 여부를 묻는다. 로컬 연결보다 느리다.

---

## 3. 네트워크 조건 정리

| 방식 | 같은 Wi-Fi 필요 | PC 필요 |
|---|:---:|:---:|
| preview 빌드로 앱 실행 | 아니오 | 아니오 |
| `eas update`로 변경 반영 | 아니오 | 업로드할 때만 |
| `npm start` | **예** | 예 |
| `npm run start:tunnel` | 아니오 | 예 |

---

## 4. 코드 수정 후 체크리스트

`eas update`나 `eas build` 전에 반드시 통과시킨다.

```bash
npm test          # 21개 라우트 화면이 예외 없이 마운트되는지
npx tsc --noEmit  # 타입 오류
```

`npm test`는 화면을 실제로 렌더해서 **import·마운트 시점 오류**를 잡는다.
Metro 번들링은 통과하지만 실기기에서만 터지는 종류(라이브러리가 try/catch 안에서
선택적 네이티브 peer를 `require`하는 경우 등)를 여기서 걸러낸다.

다만 이 테스트는 터치 동작, 레이아웃, 네이티브 뷰 동작(키보드가 실제로 밀어올리는지 포함)은
검증하지 못한다. 그 부분은 실기기 확인이 필요하다.

---

## 5. API 키

앱을 실행한 뒤 **설정 화면에서 입력**한다. `expo-secure-store`를 통해
Android Keystore에 암호화 저장된다.

`.env`나 저장소에 넣지 않는다. `EXPO_PUBLIC_*` 환경변수는 JS 번들에 평문으로 박혀서
APK나 OTA 업데이트 페이로드에서 그대로 추출된다.

---

## 6. 프로젝트 구조

```
app/                  Expo Router 파일 기반 라우팅
  (onboarding)/       최초 실행 4단계 (이름 → 신체 → 피트니스 → 목표)
  (app)/              탭 5개 (대시보드 / 기록 / 히스토리 / 성장 / 목표)
    log/              러닝·수영·사이클 기록 폼
    ai/               코치 채팅, 부상 위험, 훈련 계획
src/
  db/                 SQLite 스키마 + 쿼리
  stores/             Zustand 스토어 5개
  services/ai/        Anthropic 호출 + 프롬프트
  utils/              포매터, 테마, 상수
__tests__/            화면 마운트 스모크 테스트
```

AI 모델은 용도에 따라 나뉜다 — 운동 후 분석·오늘의 팁·채팅은 Haiku,
부상 위험 평가와 훈련 계획 생성은 Sonnet. 일일 호출 한도는 15포인트
(Haiku 0.5, Sonnet 2)로 `app_settings` 테이블에서 추적한다.
