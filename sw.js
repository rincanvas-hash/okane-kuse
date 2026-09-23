/* お金のクセ診断 — 画像だけキャッシュして、それ以外は毎回ネットから取る
   （アプリを更新したとき、古い画面が残らないようにするため） */
var CACHE = "okane-kuse-img-v1";

self.addEventListener("install", function(e){ self.skipWaiting(); });

self.addEventListener("activate", function(e){
  e.waitUntil(
    caches.keys().then(function(ks){
      return Promise.all(ks.map(function(k){ if(k !== CACHE) return caches.delete(k); }));
    }).then(function(){ return self.clients.claim(); })
  );
});

self.addEventListener("fetch", function(e){
  var url = new URL(e.request.url);
  if(e.request.method !== "GET" || url.origin !== location.origin) return;

  /* 画像はキャッシュ優先（2回目から速い・通信が弱くても出る） */
  if(/\.(jpg|png|webp)$/i.test(url.pathname)){
    e.respondWith(
      caches.match(e.request).then(function(hit){
        if(hit) return hit;
        return fetch(e.request).then(function(res){
          var copy = res.clone();
          caches.open(CACHE).then(function(c){ c.put(e.request, copy); });
          return res;
        });
      })
    );
    return;
  }

  /* HTML・JSはネット優先。つながらないときだけキャッシュを使う */
  e.respondWith(
    fetch(e.request).then(function(res){
      var copy = res.clone();
      caches.open(CACHE).then(function(c){ c.put(e.request, copy); });
      return res;
    }).catch(function(){ return caches.match(e.request); })
  );
});
