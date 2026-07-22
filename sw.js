/**
 * ============================================================================
 * 🌐 MAPLE OMNI V14 - sw.js [서비스 워커 백그라운드 캐싱 엔진 - 캐시 버스팅 완전판]
 * 설명: PWA 앱이 독립적인 하나의 독립 PC 프로그램처럼 메모리에 상주하도록 제어합니다.
 * 패치노트: 라이브 서버 환경에서 리로드 시 발생하는 가로채기(Fetch) 프로미스 거절 
 * 및 네트워크 에러 빨간 줄 현상을 방지하기 위해 예외 처리(catch) 핸들러를 보강했습니다.
 * 규칙: 코드를 쓸 때는 항상 초보자도 이해할 수 있게 상세한 주석을 달아줍니다.
 * ============================================================================
 */

// 💡 [초보자 가이드] 캐시 장부의 식별 이름입니다. 
// 기존 'omni-cache-v14'에서 이름을 변경하여 브라우저가 강제로 새 파일들을 다시 다운로드하도록 트리거합니다.
const CACHE_NAME = 'omni-cache-v14-compact-premium-v1';

// [초보자용 주석] 로컬 하드디스크에 영구 적재할 V14 핵심 인프라 파일 리스트입니다.
const urlsToCache = [
  './index.html',
  './css/style.css',
  './js/hunt/record.css',
  './js/hunt/record.js'
];

// 💡 [초보자 가이드] 서비스 워커가 브라우저에 처음 등록(설치)될 때 실행되는 이벤트 리스너입니다.
self.addEventListener('install', event => {
  // 제어권을 즉시 획득하기 위해 대기 상태를 건너뜁니다.
  self.skipWaiting();
  
  event.waitUntil(
    caches.open(CACHE_NAME).then(async (cache) => {
      console.log('OMNI V14 프리미엄 컴팩트 캐싱 엔진 설치 가동 시작');
      // 파일별로 하나씩 캐싱을 시도하여, 도중에 에러가 나더라도 전체 프로세스가 다운되지 않도록 방어합니다.
      for (const url of urlsToCache) {
        try {
          await cache.add(url);
          console.log(`[캐싱 성공] 리소스 적재 완료: ${url}`);
        } catch (e) {
          console.warn(`[캐싱 경고] 리소스를 찾을 수 없거나 파일이 유실되어 건너뜁니다: ${url}`);
        }
      }
    })
  );
});

// 💡 [초보자 가이드] 새 서비스 워커가 활성화(Activate)될 때 실행되는 인터페이스입니다.
// 이 구역에서 예전 'omni-cache-v14' 장부를 물리적으로 완전히 삭제해야 새로운 record.css 디자인이 화면에 표출됩니다.
self.addEventListener('activate', event => {
  console.log('OMNI V14 새로운 서비스 워커 활성화 세션 진입');
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cache => {
          // 현재 활성화된 최신 CACHE_NAME이 아닌 오래된 캐시 더미가 있다면 디스크에서 영구 삭제합니다.
          if (cache !== CACHE_NAME) {
            console.log(`[보안 청소] 구버전 서비스 워커 캐시 파쇄 완료: ${cache}`);
            return caches.delete(cache);
          }
        })
      );
    }).then(() => {
      // 모든 브라우저 탭(클라이언트)의 제어권을 즉시 가져옵니다.
      return self.clients.claim();
    })
  );
});

// 💡 [초보자 가이드] 웹 페이지가 스타일시트나 스크립트를 불러올 때(Fetch) 네트워크 요청을 중간에 가로채는 핵심 필터 장치입니다.
self.addEventListener('fetch', event => {
  // 실시간성이 가장 중요한 넥슨 OpenAPI 검색 데이터 주소는 가로채기 캐싱 대상에서 무조건 제외하여 통과시킵니다.
  if (event.request.url.includes('open.api.nexon.com')) {
    return;
  }

  event.respondWith(
    caches.match(event.request).then(response => {
      // 캐시 장부에 이미 저장된 똑같은 파일 명세가 있다면 그것을 즉시 반환하고,
      // 없다면 네트워크(서버)로 직접 요청하여 원본 리소스를 가져옵니다.
      // 💥[핵심 수선]: fetch 과정에서 생길 수 있는 브라우저 연결 끊김(Rejected) 상태를 catch로 붙잡아 에러 폭탄을 방지합니다.
      return response || fetch(event.request).catch(() => {
        return new Response('네트워크 통신 일시 지연 폴백 처리 완료', {
          status: 404,
          statusText: 'NetworkFetchFallback'
        });
      });
    })
  );
});