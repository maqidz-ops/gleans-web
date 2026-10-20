ALTER TABLE public.duitku_orders ALTER COLUMN owner_id DROP NOT NULL;
ALTER TABLE public.duitku_orders
 ADD COLUMN guest_hash text CHECK (guest_hash ~ '^[a-f0-9]{64}$'),
 ADD COLUMN access_hash text CHECK (access_hash ~ '^[a-f0-9]{64}$'),
 ADD COLUMN fulfillment_status text NOT NULL DEFAULT 'pending' CHECK (fulfillment_status IN ('pending','processing','completed','failed')),
 ADD COLUMN report_key text,
 ADD COLUMN report_url text,
 ADD COLUMN report_name text,
 ADD COLUMN completed_at timestamptz,
 ADD COLUMN report_expires_at timestamptz,
 ADD CONSTRAINT duitku_order_identity CHECK (owner_id IS NOT NULL OR (guest_hash IS NOT NULL AND access_hash IS NOT NULL)),
 ADD CONSTRAINT duitku_report_complete CHECK (fulfillment_status <> 'completed' OR (status='paid' AND report_key IS NOT NULL AND report_url IS NOT NULL AND completed_at IS NOT NULL AND report_expires_at > completed_at));
CREATE UNIQUE INDEX duitku_guest_request ON public.duitku_orders(guest_hash,request_key) WHERE guest_hash IS NOT NULL;

CREATE TABLE public.shield_upload_tickets (
 id uuid PRIMARY KEY,
 guest_hash text NOT NULL CHECK (guest_hash ~ '^[a-f0-9]{64}$'),
 owner_id uuid REFERENCES auth.users(id) ON DELETE RESTRICT,
 purpose text NOT NULL CHECK (purpose IN ('document','report')),
 order_id text REFERENCES public.duitku_orders(id) ON DELETE RESTRICT,
 document_name text NOT NULL,
 staging_key text NOT NULL UNIQUE,
 final_key text NOT NULL UNIQUE,
 document_url text,
 bytes integer NOT NULL CHECK (bytes BETWEEN 1 AND 26214400),
 content_type text NOT NULL,
 confirm_url text NOT NULL,
 state text NOT NULL DEFAULT 'issued' CHECK (state IN ('issued','freezing','confirmed')),
 claimed_at timestamptz,
 consumed_at timestamptz,
 created_at timestamptz NOT NULL DEFAULT now(),
 expires_at timestamptz NOT NULL DEFAULT (now()+interval '15 minutes'),
 CHECK (purpose <> 'report' OR order_id IS NOT NULL)
);
ALTER TABLE public.shield_upload_tickets ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.shield_upload_tickets FROM PUBLIC, anon, authenticated;
CREATE INDEX shield_upload_expiry ON public.shield_upload_tickets(expires_at);

CREATE FUNCTION public.reserve_guest_order(p_id text,p_owner uuid,p_guest text,p_access text,p_request uuid,p_ticket uuid,p_email text,p_name text,p_whatsapp text,p_words integer,p_amount integer,p_promo text)
RETURNS public.duitku_orders LANGUAGE plpgsql SET search_path=pg_catalog,public,pg_temp AS $$
DECLARE result public.duitku_orders; ticket public.shield_upload_tickets;
BEGIN
 PERFORM pg_advisory_xact_lock(hashtextextended(coalesce(p_owner::text,p_guest),0));
 SELECT * INTO result FROM public.duitku_orders WHERE (guest_hash=p_guest OR (p_owner IS NOT NULL AND owner_id=p_owner)) AND request_key=p_request;
 IF FOUND THEN RETURN result; END IF;
 IF (SELECT count(*) FROM public.duitku_orders WHERE (guest_hash=p_guest OR (p_owner IS NOT NULL AND owner_id=p_owner)) AND created_at>now()-interval '1 hour')>=10 THEN RAISE EXCEPTION 'RATE_LIMIT'; END IF;
 SELECT * INTO ticket FROM public.shield_upload_tickets WHERE id=p_ticket AND guest_hash=p_guest AND purpose='document' AND state='confirmed' AND consumed_at IS NULL AND expires_at>now() FOR UPDATE;
 IF NOT FOUND OR (ticket.owner_id IS NOT NULL AND ticket.owner_id IS DISTINCT FROM p_owner) THEN RAISE EXCEPTION 'INVALID_UPLOAD'; END IF;
 INSERT INTO public.duitku_orders(id,owner_id,guest_hash,access_hash,request_key,email,customer_name,whatsapp,document_name,document_key,document_url,document_bytes,word_count,amount,promo_code)
 VALUES(p_id,p_owner,p_guest,p_access,p_request,p_email,p_name,p_whatsapp,ticket.document_name,ticket.final_key,ticket.document_url,ticket.bytes,p_words,p_amount,p_promo) RETURNING * INTO result;
 UPDATE public.shield_upload_tickets SET consumed_at=now() WHERE id=p_ticket;
 RETURN result;
END $$;
REVOKE ALL ON FUNCTION public.reserve_guest_order(text,uuid,text,text,uuid,uuid,text,text,text,integer,integer,text) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.reserve_guest_order(text,uuid,text,text,uuid,uuid,text,text,text,integer,integer,text) TO project_admin;

CREATE OR REPLACE FUNCTION public.protect_duitku_order() RETURNS trigger LANGUAGE plpgsql SET search_path=pg_catalog,public,pg_temp AS $$
BEGIN
 IF NEW.id IS DISTINCT FROM OLD.id OR NEW.owner_id IS DISTINCT FROM OLD.owner_id OR NEW.guest_hash IS DISTINCT FROM OLD.guest_hash OR NEW.access_hash IS DISTINCT FROM OLD.access_hash OR NEW.amount IS DISTINCT FROM OLD.amount OR NEW.document_key IS DISTINCT FROM OLD.document_key OR NEW.request_key IS DISTINCT FROM OLD.request_key THEN RAISE EXCEPTION 'Order identity and price are immutable'; END IF;
 IF OLD.status='paid' AND (NEW.status<>'paid' OR NEW.paid_at IS DISTINCT FROM OLD.paid_at OR NEW.reference IS DISTINCT FROM OLD.reference) THEN RAISE EXCEPTION 'Settled payments cannot regress'; END IF;
 IF OLD.fulfillment_status='completed' AND (NEW.report_key IS DISTINCT FROM OLD.report_key OR NEW.report_expires_at IS DISTINCT FROM OLD.report_expires_at OR NEW.completed_at IS DISTINCT FROM OLD.completed_at OR NEW.fulfillment_status<>'completed') THEN RAISE EXCEPTION 'Published report is immutable'; END IF;
 NEW.updated_at=now(); RETURN NEW;
END $$;
