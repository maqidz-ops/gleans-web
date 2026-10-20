ALTER TABLE public.shield_upload_tickets ADD COLUMN source_hash text CHECK (source_hash ~ '^[a-f0-9]{64}$');
CREATE INDEX shield_upload_source_created ON public.shield_upload_tickets(source_hash,created_at);
CREATE INDEX shield_upload_created ON public.shield_upload_tickets(created_at);
CREATE FUNCTION public.claim_shield_upload(p_ticket jsonb,p_source text) RETURNS boolean
LANGUAGE plpgsql SET search_path=pg_catalog,public,pg_temp AS $$
DECLARE requested_bytes integer:=(p_ticket->>'bytes')::integer;
BEGIN
 IF p_source IS NULL OR p_source !~ '^[a-f0-9]{64}$' OR requested_bytes NOT BETWEEN 1 AND 26214400 THEN RAISE EXCEPTION 'Invalid upload quota'; END IF;
 PERFORM pg_advisory_xact_lock(hashtextextended('shield-upload-quota',0));
 IF (SELECT coalesce(sum(bytes),0) FROM public.shield_upload_tickets WHERE created_at>now()-interval '1 hour')+requested_bytes>4294967296 THEN RETURN false; END IF;
 IF (SELECT coalesce(sum(bytes),0) FROM public.shield_upload_tickets WHERE source_hash=p_source AND created_at>now()-interval '1 hour')+requested_bytes>268435456 THEN RETURN false; END IF;
 INSERT INTO public.shield_upload_tickets(id,guest_hash,owner_id,purpose,order_id,document_name,staging_key,final_key,bytes,content_type,confirm_url,source_hash)
 VALUES((p_ticket->>'id')::uuid,p_ticket->>'guest_hash',(p_ticket->>'owner_id')::uuid,p_ticket->>'purpose',p_ticket->>'order_id',p_ticket->>'document_name',p_ticket->>'staging_key',p_ticket->>'final_key',requested_bytes,p_ticket->>'content_type',p_ticket->>'confirm_url',p_source);
 RETURN true;
END $$;
REVOKE ALL ON FUNCTION public.claim_shield_upload(jsonb,text) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.claim_shield_upload(jsonb,text) TO project_admin;
