-- Run after Prisma migrations. Readers use server-rendered routes; PostgREST is closed by default.
DO $$DECLARE t text;BEGIN FOREACH t IN ARRAY ARRAY['Article','Channel','RawNews','ToolAffiliate','Subscriber','Profile','ArticleRevision','ArticleRedirect','AuditLog','ImportAttempt','Taxonomy','MediaAsset','SiteSetting','Partner','PartnerLink','EventDaily','RateLimit','Newsletter','NewsletterDelivery'] LOOP
EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY',t);
EXECUTE format('REVOKE ALL ON public.%I FROM anon, authenticated',t);
END LOOP;END$$;
GRANT SELECT ON public."Profile" TO authenticated;
DROP POLICY IF EXISTS own_profile ON public."Profile";
CREATE POLICY own_profile ON public."Profile" FOR SELECT TO authenticated USING (id=auth.uid()::text);
CREATE OR REPLACE FUNCTION public.stacksgpt_is_editor() RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public,pg_temp AS $$ SELECT EXISTS(SELECT 1 FROM public."Profile" WHERE id=auth.uid()::text AND active AND role IN ('ADMIN','EDITOR')) $$;
REVOKE ALL ON FUNCTION public.stacksgpt_is_editor() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.stacksgpt_is_editor() TO authenticated;
INSERT INTO storage.buckets(id,name,public,file_size_limit,allowed_mime_types) VALUES('article-media','article-media',true,5000000,ARRAY['image/png','image/jpeg','image/webp','image/avif']) ON CONFLICT(id) DO NOTHING;
DROP POLICY IF EXISTS editorial_media_upload ON storage.objects;
CREATE POLICY editorial_media_upload ON storage.objects FOR INSERT TO authenticated WITH CHECK(bucket_id='article-media' AND public.stacksgpt_is_editor() AND (storage.foldername(name))[1]=auth.uid()::text);
-- Uploaded images are public illustration assets; source documents and editorial notes never go into this bucket.
