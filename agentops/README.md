# AgentOps Scaffold

هذا المجلد يحتوي على سكافولد كامل لبناء Agent يعتمد على Agents SDK و GPT Actions مع تكامل Supabase وGitHub CI. يتضمن المجلد:

- **API خادم** عبر Express لحماية الاستدعاءات من Custom GPT.
- **Agent** مهيأ بأدوات لتوليد مهاجرات SQL، فتح Pull Requests، وتسجيل التغييرات في Supabase.
- **أدوات** منفصلة للتعامل مع OpenAI، PostgreSQL (Dry-run)، Octokit، وSupabase.
- **مهاجرة قاعدة بيانات** لإنشاء جدول `change_requests` في Supabase.
- **Workflow** على GitHub للتحقق من المهاجرات على قاعدة Postgres ظل.
- **ملف OpenAPI** لربط الخادم كـ GPT Action داخل ChatGPT.
- **سكريبت تدقيق** لعرض آخر التغييرات والتقدم المحقق.

## الإعداد السريع

1. **تثبيت الحزم**
   ```bash
   cd agentops
   npm install
   ```

2. **تهيئة المتغيرات**
   انسخ `.env.example` إلى `.env` واملأ القيم دون مشاركة أسرار الإنتاج. استخدم حسابات ظل/تجريبية أثناء التطوير.

3. **تشغيل الخادم محليًا**
   ```bash
   npm run dev
   ```

4. **الربط مع Custom GPT**
   - ارفع `openapi/action.yaml` في إعداد الـAction داخل GPT Builder.
   - استخدم `x-api-key` نفسه الموجود في الخادم للتوثيق.

5. **تشغيل التدقيق**
   ```bash
   npx ts-node db/audit.ts
   ```

## أمان الأسرار

- لا تضع مفاتيح فعلية في المستودع؛ استخدم متغيرات البيئة وGitHub Secrets.
- يقتصر الخادم على الطلبات الموثقة بـ`x-api-key`.

## سير العمل

1. يقوم المستخدم بإرسال طلب.
2. يرسل Custom GPT الطلب إلى `/api/proposals`.
3. يولد الـAgent مهاجرة SQL ويقوم Dry-run ثم يسجلها في Supabase.
4. عند الموافقة، يستدعي Custom GPT `/api/proposals/{id}/approve` لفتح PR.
5. GitHub CI يطبق المهاجرات على قاعدة ظل ويتحقق منها.
6. يمكن استخدام سكريبت التدقيق لمتابعة التقدم.

راجع الملفات داخل `src/` و`db/` للتخصيص المتقدم.
