# Smart Warehouse Management System 🚀

نظام متكامل لإدارة المستودعات والمخازن الذكية، مصمم باستخدام **Expo** و **React Native** مع دعم كامل لكل من **Android**, **iOS**, و **Web**. يتميز النظام بواجهة عصرية احترافية ونظام أمان متقدم.

## ✨ المميزات الرئيسية

- **واجهة مستخدم عصرية (Premium UI):** تصميم Split-Screen للويب و Floating Cards للجوال مع تأثيرات إضاءة خافتة.
- **إدارة الجلسات الذكية:** تسجيل خروج تلقائي بعد 10 دقائق من عدم النشاط لحماية البيانات.
- **التوافق الكامل:** تجربة مستخدم مخصصة لكل منصة (ويب وجوال).
- **قاعدة بيانات سحابية:** التكامل مع **Turso (LibSQL)** لضمان سرعة البيانات وتزامنها.
- **نظام إشعارات (Toasts):** نظام تنبيهات مدمج لإعلام المستخدمين بالنجاح أو الفشل.
- **إدارة المنتجات:** إضافة، تعديل، وسحب الكميات مع سجل كامل للعمليات (Logs).

## 🛠️ التقنيات المستخدمة

- **Framework:** [Expo SDK 54](https://expo.dev/)
- **Database:** [Turso / LibSQL](https://turso.tech/)
- **State Management:** React Context API
- **Icons:** [Lucide React Native](https://lucide.dev/)
- **Styling:** Vanilla CSS-in-JS (StyleSheet)
- **Deployment:** Vercel (Web) / EAS Build (Android/iOS)

## 🚀 البدء في التشغيل

### 1. المتطلبات
تأكد من تثبيت [Node.js](https://nodejs.org/) و [Git].

### 2. التثبيت
```bash
# استنساخ المشروع
git clone https://github.com/your-username/smart-warehouse.git

# الانتقال للمجلد
cd smart-warehouse

# تثبيت المكتبات
npm install
```

### 3. إعداد البيئة
قم بإنشاء ملف `.env` في المجلد الرئيسي وأضف البيانات التالية:
```env
EXPO_PUBLIC_DATABASE_URL=your_turso_url
EXPO_PUBLIC_DATABASE_TOKEN=your_turso_token
```

### 4. التشغيل
```bash
# تشغيل التطبيق
npm start

# تشغيل نسخة الويب
npm run web
```

## 📂 هيكلة المشروع
- `app/`: صفحات التطبيق ونظام التوجيه (Expo Router).
- `components/`: المكونات القابلة لإعادة الاستخدام.
- `services/`: خدمات البيانات والاتصال بقاعدة البيانات.
- `context/`: إدارة الحالة العالمية (Auth, Toasts, Cache).
- `assets/`: الصور، الخطوط، والوسائط.

---
تم التطوير بواسطة **Smart Store Team** 💻✨
