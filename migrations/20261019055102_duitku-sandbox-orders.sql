CREATE TABLE public.duitku_orders (
  id text PRIMARY KEY CHECK (id ~ '^GLS-[0-9a-f-]{36}$'),
  owner_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
  request_key uuid NOT NULL,
  email text NOT NULL,
  customer_name text NOT NULL,
  whatsapp text NOT NULL,
  document_name text NOT NULL,
  document_key text NOT NULL UNIQUE,
  document_url text NOT NULL,
  document_bytes integer NOT NULL CHECK (document_bytes BETWEEN 1 AND 26214400),
  word_count integer NOT NULL CHECK (word_count BETWEEN 0 AND 25000),
  amount integer NOT NULL CHECK (amount BETWEEN 1 AND 1000000),
  promo_code text,
  environment text NOT NULL DEFAULT 'sandbox' CHECK (environment = 'sandbox'),
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','creating','pending','paid','failed','expired')),
  payment_method text,
  reference text UNIQUE,
  payment_url text,
  qr_string text,
  va_number text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  checked_at timestamptz,
  expires_at timestamptz,
  paid_at timestamptz,
  UNIQUE (owner_id, request_key),
  CHECK (status <> 'paid' OR (paid_at IS NOT NULL AND reference IS NOT NULL))
);
CREATE INDEX duitku_orders_owner_created ON public.duitku_orders(owner_id, created_at DESC);
ALTER TABLE public.duitku_orders ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.duitku_orders FROM anon, authenticated;
GRANT SELECT ON public.duitku_orders TO authenticated;
CREATE POLICY duitku_owner_read ON public.duitku_orders FOR SELECT TO authenticated USING (owner_id = (SELECT auth.uid()));

-- Only trusted server clients can reserve or alter payments. Never expose write RPCs to users.
CREATE FUNCTION public.reserve_duitku_order(p_id text, p_owner uuid, p_request uuid, p_email text, p_name text, p_whatsapp text, p_document text, p_key text, p_url text, p_bytes integer, p_words integer, p_amount integer, p_promo text)
RETURNS public.duitku_orders LANGUAGE plpgsql SET search_path = pg_catalog, public, pg_temp AS $$
DECLARE result public.duitku_orders;
BEGIN
  PERFORM pg_advisory_xact_lock(hashtextextended(p_owner::text, 0));
  SELECT * INTO result FROM public.duitku_orders WHERE owner_id = p_owner AND request_key = p_request;
  IF FOUND THEN RETURN result; END IF;
  IF (SELECT count(*) FROM public.duitku_orders WHERE owner_id = p_owner AND created_at > now() - interval '1 hour') >= 10 THEN
    RAISE EXCEPTION 'RATE_LIMIT';
  END IF;
  INSERT INTO public.duitku_orders(id,owner_id,request_key,email,customer_name,whatsapp,document_name,document_key,document_url,document_bytes,word_count,amount,promo_code)
  VALUES(p_id,p_owner,p_request,p_email,p_name,p_whatsapp,p_document,p_key,p_url,p_bytes,p_words,p_amount,p_promo) RETURNING * INTO result;
  RETURN result;
END;
$$;
REVOKE ALL ON FUNCTION public.reserve_duitku_order(text,uuid,uuid,text,text,text,text,text,text,integer,integer,integer,text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.reserve_duitku_order(text,uuid,uuid,text,text,text,text,text,text,integer,integer,integer,text) TO project_admin;

CREATE FUNCTION public.claim_duitku_check(p_id text) RETURNS boolean LANGUAGE plpgsql SET search_path = pg_catalog, public, pg_temp AS $$
BEGIN
 UPDATE public.duitku_orders SET checked_at = now() WHERE id = p_id AND status <> 'paid' AND (checked_at IS NULL OR checked_at < now() - interval '30 seconds');
 RETURN FOUND;
END;
$$;
REVOKE ALL ON FUNCTION public.claim_duitku_check(text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.claim_duitku_check(text) TO project_admin;

CREATE FUNCTION public.protect_duitku_order() RETURNS trigger LANGUAGE plpgsql SET search_path = pg_catalog, public, pg_temp AS $$
BEGIN
 IF NEW.owner_id IS DISTINCT FROM OLD.owner_id OR NEW.amount IS DISTINCT FROM OLD.amount OR NEW.document_key IS DISTINCT FROM OLD.document_key OR NEW.request_key IS DISTINCT FROM OLD.request_key THEN
   RAISE EXCEPTION 'Order identity and price are immutable';
 END IF;
 IF OLD.status = 'paid' AND (NEW.status <> 'paid' OR NEW.paid_at IS DISTINCT FROM OLD.paid_at OR NEW.reference IS DISTINCT FROM OLD.reference) THEN
   RAISE EXCEPTION 'Settled payments cannot regress';
 END IF;
 NEW.updated_at = now();
 RETURN NEW;
END;
$$;
CREATE TRIGGER protect_duitku_order BEFORE UPDATE ON public.duitku_orders FOR EACH ROW EXECUTE FUNCTION public.protect_duitku_order();

-- Private bucket is provisioned separately. These policies grant only upload/read;
-- customers cannot overwrite or delete documents after attaching them to an order.
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;
CREATE POLICY shield_sandbox_read ON storage.objects FOR SELECT TO authenticated
 USING (bucket = 'shield-sandbox-documents' AND uploaded_by = (SELECT auth.jwt() ->> 'sub'));
CREATE POLICY shield_sandbox_upload ON storage.objects FOR INSERT TO authenticated
 WITH CHECK (bucket = 'shield-sandbox-documents' AND uploaded_by = (SELECT auth.jwt() ->> 'sub') AND (storage.foldername(key))[1] = (SELECT auth.jwt() ->> 'sub'));
GRANT SELECT, INSERT ON storage.objects TO authenticated;
GRANT USAGE ON SCHEMA storage TO authenticated;
