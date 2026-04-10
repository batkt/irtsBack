# QR Ирц Бүртгэлийн Систем

## Бүтэц
```
project/
├── backend/
│   ├── models/
│   │   ├── irts.js          ← Таны одоогийн model (өөрчлөлтгүй)
│   │   ├── qrToken.js       ← Шинэ: QR token model (TTL index)
│   │   └── wifiConfig.js    ← Шинэ: WiFi тохиргоо model
│   ├── services/
│   │   └── qrService.js     ← QR үүсгэх, rotate, шалгах
│   ├── controllers/
│   │   └── irtsController.js ← Ирц бүртгэх logic
│   ├── middleware/
│   │   └── guards.js        ← Mobile + WiFi IP шалгалт
│   ├── routes/
│   │   ├── qrRoutes.js      ← /api/qr/*
│   │   └── irtsRoutes.js    ← /api/irts/*
│   └── server.js            ← Express + cron
│
└── frontend/
    ├── app/
    │   ├── scan/page.jsx        ← QR скан хуудас (утас)
    │   ├── admin/qr/page.jsx    ← Admin QR дэлгэц
    │   └── mobile-only/page.jsx ← Desktop анхааруулга
    └── middleware.js            ← Next.js route guard
```

## Суулгах

### Backend
```bash
cd backend
npm install
cp .env.example .env    # .env тохируулах
npm run dev
```

### .env жишээ
```
MONGODB_URI=mongodb://localhost:27017/irts_db
PORT=5000
FRONTEND_URL=http://localhost:3000
JWT_SECRET=your_secret_key
```

### Frontend
```bash
cd frontend
npm install
# .env.local үүсгэх:
# NEXT_PUBLIC_API_URL=http://localhost:5000
npm run dev
```

## Хэрхэн ажилладаг

### QR rotation
- Server эхлэхэд автоматаар 4 QR үүснэ (oroh, garoh, tsai_oroh, tsai_garoh)
- Cron минут бүр шинэ token үүсгэж, хуучиныг хааж, MongoDB TTL автомат устгана

### Ирц бүртгэлийн дараалал
1. Ажилтан утасаараа QR уншина
2. `/scan?token=xxx&turul=oroh` хуудас нээгдэнэ
3. Mobile guard шалгах (desktop бол блок)
4. GPS байрлал авах
5. Backend-д POST /api/irts/burtgel
6. Backend шалгалтууд: Mobile UA → WiFi IP → QR token → давхардал
7. irts collection-д бичнэ

### WiFi тохиргоо нэмэх
```js
// MongoDB-д wifiConfig document үүсгэх
{
  baiguullagiinId: "your_org_id",
  wifiNer: "OfficeWifi",
  ipRange: ["192.168.1.0/24"],
  zuvshurulusenIp: ["192.168.1.100"],
  idevkhitei: true
}
```

## Шалгуурууд (зурагны дагуу)
1. ✅ QR unshuulah - QR код уншуулах
2. ✅ WiFi automatic connection hiigeed ip awah - WiFi IP шалгах
3. ✅ 1 tutamd url oorchlogdoh - Минут бүр URL/token өөрчлөгдөх
4. ✅ Location awah - GPS байрлал авах
5. ✅ Irts darah tsag hoorond ajilladag bh - Орох/гарах цагийн хооронд
6. ✅ Irts daralt burt 1 udaa dardag bh - Нэг удаа дарах
7. ✅ Ajiltan ooriin neriig songoh - Ажилтан өөрийн нэрэй сонгох
8. ✅ Odort 1 hun 4 udaa irts dardag bh - Өдөрт 4 удаа (орох, цайн, цайнгарах, гарах)
