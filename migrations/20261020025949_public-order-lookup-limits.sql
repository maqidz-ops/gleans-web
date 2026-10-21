-- Server-only counters shared by all application instances; raw IPs are never stored.
CREATE TABLE public.order_lookup_limits (
  key text NOT NULL CHECK (key = 'global' OR key ~ '^[0-9a-f]{64}$'),
  window_start timestamptz NOT NULL,
  attempts integer NOT NULL CHECK (attempts > 0),
  PRIMARY KEY (key, window_start)
);
ALTER TABLE public.order_lookup_limits ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.order_lookup_limits FROM PUBLIC, anon, authenticated;
CREATE INDEX order_lookup_limits_window ON public.order_lookup_limits (window_start);
CREATE INDEX duitku_orders_whatsapp_created ON public.duitku_orders (whatsapp, created_at DESC);

CREATE FUNCTION public.consume_order_lookup(p_key text) RETURNS boolean
LANGUAGE plpgsql SET search_path = pg_catalog, public, pg_temp AS $$
DECLARE current_window timestamptz := date_trunc('minute', now()); used integer;
BEGIN
  IF p_key IS NULL OR p_key !~ '^[0-9a-f]{64}$' THEN RAISE EXCEPTION 'Invalid lookup key'; END IF;
  DELETE FROM public.order_lookup_limits WHERE window_start < current_window - interval '2 minutes';
  INSERT INTO public.order_lookup_limits(key,window_start,attempts) VALUES('global',current_window,1)
    ON CONFLICT (key,window_start) DO UPDATE SET attempts = least(public.order_lookup_limits.attempts + 1, 1201)
    RETURNING attempts INTO used;
  IF used > 1200 THEN RETURN false; END IF;
  INSERT INTO public.order_lookup_limits(key,window_start,attempts) VALUES(p_key,current_window,1)
    ON CONFLICT (key,window_start) DO UPDATE SET attempts = least(public.order_lookup_limits.attempts + 1, 13)
    RETURNING attempts INTO used;
  RETURN used <= 12;
END;
$$;
REVOKE ALL ON FUNCTION public.consume_order_lookup(text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.consume_order_lookup(text) TO project_admin;
