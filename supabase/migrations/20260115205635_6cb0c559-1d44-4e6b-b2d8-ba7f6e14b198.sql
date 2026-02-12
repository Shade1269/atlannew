-- إضافة سياسات الأمان لـ store-assets bucket
-- السماح لجميع المستخدمين المسجلين بقراءة الملفات العامة
CREATE POLICY "Allow public read access to store-assets"
ON storage.objects
FOR SELECT
USING (bucket_id = 'store-assets');

-- السماح للمستخدمين المسجلين برفع الملفات في مجلدهم الخاص
CREATE POLICY "Allow authenticated users to upload to store-assets"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'store-assets' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- السماح للمستخدمين بتحديث ملفاتهم
CREATE POLICY "Allow users to update their own files in store-assets"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'store-assets' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- السماح للمستخدمين بحذف ملفاتهم
CREATE POLICY "Allow users to delete their own files in store-assets"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'store-assets' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);