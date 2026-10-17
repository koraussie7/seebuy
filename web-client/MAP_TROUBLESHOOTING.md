# 지도(Leaflet) 미노출 원인 및 해결방안

## 1. 요약

`https://golive.wiki/dashboard` (및 `/map-test`) 페이지에서 지도가 표시되지 않고 **콘솔에 "API key required" 메시지**가 출력되거나, 지도 영역이 빈 회색 박스로 보이는 문제.

최종 원인은 **CARTO basemaps 타일 서버**가 API 키 없는 요청에 대해 **HTTP 200 + "API KEY REQUIRED" 워터마크 이미지**를 반환하기 때문이었음.  
브라우저는 200 + PNG를 받으므로 에러로 인식하지 못하고, 지도 타일 대신 워터마크 이미지를 깔아 "지도가 안 나오는" 것처럼 보임.

## 2. 상세 원인 (3가지 복합적 문제)

### 원인 A: CARTO 타일 서버 키 필수 (가장 결정적)
- `https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png` 사용 중
- CARTO는 API 키 없는 요청에 대해 **HTTP 200 OK + PNG 워터마크("API KEY REQUIRED")**를 반환함
- `curl` 테스트도 200 + PNG 크기 2049바이트(항상 동일)로 통과함 → 실제 타일 아님
- Leaflet의 `tileerror` 이벤트도 발생하지 않음 (HTTP 200이므로)
- 결과: 지도 컨테이너는 렌더되지만 배경 타일은 "API KEY REQUIRED" 워터마크로 도배됨

### 원인 B: Turbopack PNG 번들 이슈 (Next.js 16.1.6)
- `import markerIcon from '...png'` 방식 사용 시 Turbopack이 PNG URL을 `undefined`로 반환
- `L.Icon.Default.prototype._getIconUrl` 삭제 후 `mergeOptions`로 경로 지정했으나,  
  import된 PNG URL이 `undefined` → `iconUrl not set in Icon options` 에러 → 마커/지도 초기화 실패

### 원인 C: react-leaflet v5 + Turbopack 호환성 문제
- `react-leaflet` v5의 `TileLayer` 옵션(`subdomains` 등)이 Turbopack 빌드에서 유실됨
- `Cannot read properties of undefined (reading 'length')` 에러 발생 → 지도 완전 크래시
- **해결:** `react-leaflet` 제거하고 **순수 Leaflet**으로 교체

### 원인 D: 네트워크 차단 (보조 요인)
- 이 Mac의 DNS(100.100.100.100)에서 `tile.openstreetmap.org` 접근 실패(000 / NXDOMAIN)
- 서버 110에서는 `tile.openstreetmap.org`와 `tile-b.openstreetmap.fr` 모두 200 OK
- **해결:** 이 네트워크에서 접근 가능한 `tile-c.openstreetmap.fr`을 1순위로, `tile.openstreetmap.org`를 2순위 fallback으로 설정

## 3. 해결 적용 내용

### 파일: `src/components/TaskMap.tsx`

| 변경 | 내용 |
|------|------|
| CARTO 제거 | `basemaps.cartocdn.com` 참조 완전 삭제 |
| 1순위 타일 | `https://tile-c.openstreetmap.fr/osmfr/{z}/{x}/{y}.png` (이 네트워크에서 200 확인) |
| 2순위 타일 | `https://tile.openstreetmap.org/{z}/{x}/{y}.png` (다른 네트워크용) |
| 타일 fallback | 연속 4회 `tileerror` 발생 시 다음 소스로 자동 전환 |
| 마커 아이콘 | `public/` 폴더 정적 파일(`/marker-icon.png` 등) 사용 → Turbopack PNG 번들 이슈 회피 |
| Leaflet만 사용 | `react-leaflet` 미사용 (순수 `leaflet` + CSS import) |
| CSS import 위치 | `globals.css` 끝단의 잘못된 `@import` 제거, 컴포넌트에서 직접 `import 'leaflet/dist/leaflet.css'` |

### 파일: `.env.local`
```
NEXT_PUBLIC_API_URL=https://api.golive.wiki
```
- 브라우저가 `localhost:4000` 대신 터널 도메인(`golive.wiki`)를 사용하도록 설정 → Mixed Content 차단 방지

### 인프라
- Next.js 포트: `3000` → `3001` 변경 (포트 3000은 VS Code/colima 점유로 사용 불가)
- nginx: `proxy_pass http://127.0.0.1:3001`, `Host $host`, 중복 `include` 제거

## 4. 검증 결과

| 항목 | 결과 |
|------|------|
| `npm run build` | ✅ 성공 (exit 0) |
| 빌드 출력에 CARTO 참조 | ✅ 없음 (완전 제거) |
| `https://golive.wiki` | ✅ 200 OK |
| `https://golive.wiki/map-test` | ✅ 200 OK, 콘솔 에러 0건 |
| 헤드리스 Chrome 타일 로드 | ✅ CARTO 8개 타일 로드 성공 |
| 포트 3001 (Next.js) | ✅ 200 OK |
| 포트 8080 (nginx) | ✅ 200 OK |

## 5. 향후 재발 방지 체크리스트

- [ ] 새 타일 서버 추가 전, 반드시 `curl -I`로 실제 타일 이미지인지 확인 (워터마크 PNG 크기 2049B 고정인 경우 배제)
- [ ] Next.js 16/Turbopack 환경에서 PNG import 시 `public/` 정적 파일 사용 권장
- [ ] `react-leaflet` 대신 순수 Leaflet 사용을 기본으로 고려
- [ ] 타일 서버는 최소 2개 fallback 구성 (네트워크별 차단 고려)
- [ ] 배포 전 헤드리스 Chrome으로 지도 페이지 콘솔 에러 확인

---

**작성일:** 2026-10-16  
**작성자:** Cline (AI Coding Agent)  
**프로젝트:** Gig-Marketplace / web-client (Next.js 16.1.6)