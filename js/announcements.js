/**
 * Cloudflare Pages Function: /api/announcements
 * ------------------------------------------------------------
 * 「教会からのお知らせ」（台風による臨時休会など、緊急・臨時の情報）を
 * KVに保存し、admin/schedule.html の管理画面から誰でも更新できるように
 * するAPIです。schedule.js と同じKV namespace（SCHEDULE_KV）・同じ
 * パスワード（ADMIN_PASSWORD）をそのまま使うので、新しい設定は不要です。
 *
 * データ形式： { items: [ { id:"...", level:"urgent"|"info", title:"...", body:"..." }, ... ] }
 *   level: "urgent" = 赤（休会・警報など、特に重要なもの）
 *          "info"   = 青（通常のお知らせ）
 *
 * KVが未設定、またはitemsが空の間は、サイト側は何も表示しません
 * （js/content.js の notices.items が空のバックアップとして使われます）。
 * ------------------------------------------------------------
 */

function json(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' }
  });
}

export async function onRequestGet(context) {
  const { env } = context;
  try {
    if (!env.SCHEDULE_KV) return json({ items: [] });
    const raw = await env.SCHEDULE_KV.get('announcements');
    if (!raw) return json({ items: [] });
    return json(JSON.parse(raw));
  } catch (err) {
    console.error('announcements GET error:', err);
    return json({ items: [] });
  }
}

export async function onRequestPost(context) {
  const { request, env } = context;
  try {
    const body = await request.json();
    const password = String(body.password || '');

    if (!env.ADMIN_PASSWORD) {
      return json({ ok: false, error: '管理者パスワードがまだ設定されていません（Cloudflareの環境変数 ADMIN_PASSWORD を設定してください）' }, 500);
    }
    if (password !== env.ADMIN_PASSWORD) {
      return json({ ok: false, error: 'パスワードが違います' }, 401);
    }
    if (!Array.isArray(body.items)) {
      return json({ ok: false, error: 'データの形式が正しくありません' }, 400);
    }
    if (!env.SCHEDULE_KV) {
      return json({ ok: false, error: 'KVがまだ設定されていません（CloudflareのFunctions設定を確認してください）' }, 500);
    }

    // 簡易サニタイズ（件数・文字数の上限だけ設ける）
    const clean = {
      items: body.items
        .slice(0, 20)
        .map(it => ({
          id: String(it.id || ('n' + Date.now().toString(36) + Math.random().toString(36).slice(2, 7))),
          level: it.level === 'info' ? 'info' : 'urgent',
          title: String(it.title || '').slice(0, 80),
          body: String(it.body || '').slice(0, 300)
        }))
        .filter(it => it.title || it.body)
    };

    await env.SCHEDULE_KV.put('announcements', JSON.stringify(clean));
    return json({ ok: true });

  } catch (err) {
    console.error('announcements POST error:', err);
    return json({ ok: false, error: 'サーバーエラーが発生しました' }, 500);
  }
}
