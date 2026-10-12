-- ==============================================================================
-- KONAS PERSADIA 2026 - RPC PENCARIAN TIKET PUBLIK (AMAN & PRIVASI TERJAGA)
-- Jalankan script ini di Supabase SQL Editor:
-- Dashboard Supabase -> SQL Editor -> New Query -> Tempel (Paste) -> Run
-- ==============================================================================

-- 1. Buat fungsi RPC cari_tiket_peserta dengan SECURITY DEFINER
-- Fungsi ini hanya mengembalikan field untuk e-ticket tanpa membocorkan data medis/alamat.
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
  status_pembayaran text
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

  -- Tolak jika keyword terlalu pendek (minimal 3 karakter untuk mencegah scraping)
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
    p.id,
    p.no_registrasi,
    p.nama_lengkap,
    -- Samarkan sebagian nomor WhatsApp demi privasi peserta (misal: 0812****9821)
    CASE 
      WHEN length(p.whatsapp) > 7 THEN 
        substring(p.whatsapp from 1 for 4) || '****' || substring(p.whatsapp from length(p.whatsapp) - 3)
      ELSE p.whatsapp 
    END AS whatsapp,
    p.kategori_peserta,
    p.pilihan_kegiatan,
    p.institusi,
    p.cabang_persadia,
    p.status_pembayaran
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

-- 2. Berikan izin eksekusi ke anonim (publik website) dan authenticated (admin)
GRANT EXECUTE ON FUNCTION public.cari_tiket_peserta(text, text) TO anon, authenticated, service_role;

-- 3. Berikan komentar dokumentasi
COMMENT ON FUNCTION public.cari_tiket_peserta(text, text) IS 
'Fungsi pencarian tiket publik aman. Hanya mengembalikan data tiket resmi tanpa membocorkan data medis, riwayat kesehatan, atau alamat pribadi peserta.';
