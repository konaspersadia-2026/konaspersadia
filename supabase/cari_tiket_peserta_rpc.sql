-- ==============================================================================
-- KONAS PERSADIA 2026 - FIX RPC PENCARIAN TIKET PUBLIK (TYPE CAST & PRIVASI)
-- Jalankan SELURUH script ini di Supabase SQL Editor:
-- Dashboard Supabase -> SQL Editor -> New Query -> Tempel (Paste) -> Run
-- ==============================================================================

-- 1. Hapus fungsi lama terlebih dahulu untuk mencegah error:
-- "cannot change return type of existing function"
DROP FUNCTION IF EXISTS public.cari_tiket_peserta(text, text);
DROP FUNCTION IF EXISTS public.cari_tiket_peserta(text);

-- 2. Buat fungsi RPC dengan casting tipe eksplisit (p.id::bigint)
CREATE OR REPLACE FUNCTION public.cari_tiket_peserta(
  p_keyword text,
  p_nama text DEFAULT ''
)
RETURNS TABLE (
  id bigint,
  no_registrasi text,
  nama_lengkap text,
  whatsapp text,
  kategori_peserta text,
  pilihan_kegiatan text,
  institusi text,
  cabang_persadia text,
  status_pembayaran text,
  hak_gala_dinner boolean
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_clean text;
  v_nama_clean text;
  v_phone_digits text;
  v_core_phone text;
BEGIN
  v_clean := trim(coalesce(p_keyword, ''));
  v_nama_clean := trim(coalesce(p_nama, ''));

  -- Tolak jika keyword terlalu pendek (minimal 3 karakter)
  IF length(v_clean) < 3 THEN
    RETURN;
  END IF;

  -- Ekstrak digit jika input berupa nomor telepon
  v_phone_digits := regexp_replace(v_clean, '\D', '', 'g');
  IF length(v_phone_digits) >= 8 THEN
    -- Ambil 8 digit terakhir untuk mencocokkan format 08..., 628..., 8..., atau berspasi/berstrip
    v_core_phone := substring(v_phone_digits from length(v_phone_digits) - 7);
  ELSE
    v_core_phone := '';
  END IF;

  RETURN QUERY
  SELECT 
    p.id::bigint AS id,
    coalesce(p.no_registrasi, '')::text AS no_registrasi,
    coalesce(p.nama_lengkap, '')::text AS nama_lengkap,
    -- Samarkan sebagian nomor WhatsApp demi privasi peserta (misal: 0812****9821)
    CASE 
      WHEN length(coalesce(p.whatsapp, '')) > 7 THEN 
        substring(p.whatsapp from 1 for 4) || '****' || substring(p.whatsapp from length(p.whatsapp) - 3)
      ELSE coalesce(p.whatsapp, '') 
    END::text AS whatsapp,
    coalesce(p.kategori_peserta, '')::text AS kategori_peserta,
    coalesce(p.pilihan_kegiatan, '')::text AS pilihan_kegiatan,
    coalesce(p.institusi, '')::text AS institusi,
    coalesce(p.cabang_persadia, '')::text AS cabang_persadia,
    coalesce(p.status_pembayaran, 'Menunggu Verifikasi')::text AS status_pembayaran,
    coalesce(p.hak_gala_dinner, false)::boolean AS hak_gala_dinner
  FROM public.pendaftar p
  WHERE 
    (
      -- 1. Pencocokan Nomor Registrasi (contoh: KNS2026-xxxxx atau angka registrasi)
      p.no_registrasi ILIKE '%' || v_clean || '%'
      
      -- 2. Pencocokan Nomor WhatsApp (mengabaikan spasi, tanda strip, atau awalan +62/0/8 di database)
      OR (
        v_core_phone <> '' 
        AND regexp_replace(p.whatsapp, '\D', '', 'g') LIKE '%' || v_core_phone || '%'
      )
      
      -- 3. Pencocokan Nama Lengkap (minimal 3 karakter)
      OR (
        length(v_clean) >= 3 
        AND p.nama_lengkap ILIKE '%' || v_clean || '%'
      )
    )
    -- Filter nama tambahan jika diisi (opsional pada form)
    AND (
      v_nama_clean = '' 
      OR p.nama_lengkap ILIKE '%' || v_nama_clean || '%'
    )
  ORDER BY p.id ASC
  LIMIT 25;
END;
$$;

-- 3. Berikan izin eksekusi ke anonim (publik website), authenticated (admin), dan service_role
GRANT EXECUTE ON FUNCTION public.cari_tiket_peserta(text, text) TO anon, authenticated, service_role;

-- 4. Dokumentasi
COMMENT ON FUNCTION public.cari_tiket_peserta(text, text) IS 
'Fungsi pencarian tiket publik aman. Hanya mengembalikan data tiket resmi dengan casting tipe data p.id::bigint.';
