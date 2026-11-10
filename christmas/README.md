# Christmas / Yangi yil mavzusi

Saytning bayram versiyasi. Barcha bayram kodi shu folderda; asosiy kodga faqat kichik ulanish nuqtalari qo'shilgan.

## Qachon yoqiladi

1. **Avtomatik** — 1-dekabrdan 14-yanvargacha (`config.js` → `SEASON`).
2. **URL orqali** (istalgan kuni ko'rish uchun): `/?theme=christmas`, o'chirish: `/?theme=default`.
   Tanlov brauzer sessiyasi davomida eslab qolinadi.
3. **Env orqali**: `NEXT_PUBLIC_THEME=christmas` yoki `NEXT_PUBLIC_THEME=default` (sanadan ustun turadi).

Kun vaqtini ham tekshirish mumkin: `/?theme=christmas&tod=night` (`sunrise | day | sunset | night`).

## Fayllar

| Fayl | Nima qiladi |
| --- | --- |
| `scene.js` | 3D sahna: qor bilan qoplangan yer va yo'l chetlari, archalar ustida qor, to'siqlar va treyler tomida qor, yog'ayotgan qor, treyler atrofidagi gerlyanda chiroqlari |
| `textures.js` | Qor teksturalari va treylerning bayram dizayni (logo, "HAPPY NEW YEAR", telefon/sayt) |
| `LogoDecor.js` | Header logosi atrofidagi gerlyanda va Santa qalpog'i |
| `christmas.css` | Logo bezaklari va header ostidagi qor chizig'i (faqat `html[data-theme='christmas']` da ishlaydi) |
| `ChristmasTheme.js`, `useChristmas.js`, `config.js` | Mavzuni yoqish/o'chirish mantig'i |

## Asosiy koddagi ulanish nuqtalari

- `lib/scene/index.js` — `theme: 'christmas'` bo'lsa `scene.js` ni dinamik yuklaydi (oddiy saytda yuklanmaydi).
- `lib/scene/world.js` — `RAILS`, `TREE_TIERS`, `ROAD_*` konstantalari va `world.parts` eksport qilindi.
- `lib/scene/truck.js` — treyler `userData` ga `sideMat`, `rearMat` qo'shildi.
- `components/SceneBackground.js`, `components/Header.js`, `app/layout.js` — mavzuni ulash.
