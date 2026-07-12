/**
 * Cloudflare Pages Function: /api/schedule
 * ------------------------------------------------------------
 * 「今月の予定（upcoming）」をKV（Cloudflareのキー・バリュー・ストレージ）に
 * 保存し、GitHubにもコードにも触れずに、専用の管理画面
 * （/admin/schedule.html）から誰でも更新できるようにするAPIです。
 *
 * データ形式： { items: [ { date:"2026-08-02", label:"...", items:["...","..."] }, ... ] }
 * date はHTMLの日付入力(<input type="date">)からそのまま受け取れる YYYY-MM-DD 形式です。
 * 曜日はサイト側・管理画面側の両方で日付から自動計算するので、入力の手間がありません。
 *
 * 【事前設定（Kenさんが1回だけ行う作業）】
 *  1. Cloudflare Pagesプロジェクトの「設定」→「Functions」→
 *     「KV namespace bindings」で新しいKV namespaceを作成し、
 *     変数名を `SCHEDULE_KV` としてバインドする。
 *  2. 「設定」→「環境変数」で `ADMIN_PASSWORD` を追加し、
 *     管理画面で使うパスワードを設定する。
 *
 * KVが未設定の間は、GET時にjs/content.js側のバックアップデータを
 * サイトが自動的に表示するので、壊れた状態にはなりません。
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
    const raw = await env.SCHEDULE_KV.get('schedule');
    if (!raw) return json({ items: [] });
    return json(JSON.parse(raw));
  } catch (err) {
    console.error('schedule GET error:', err);
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

    // 簡易サニタイズ（日付形式・文字数・件数の上限だけ設ける）
    const clean = {
      items: body.items
        .filter(it => /^\d{4}-\d{2}-\d{2}$/.test(String(it.date || '')))
        .slice(0, 60)
        .map(it => ({
          date: String(it.date),
          label: String(it.label || '').slice(0, 60),
          items: Array.isArray(it.items)
            ? it.items.slice(0, 10).map(e => String(e).slice(0, 200)).filter(Boolean)
            : []
        }))
        .sort((a, b) => a.date.localeCompare(b.date))
    };

    await env.SCHEDULE_KV.put('schedule', JSON.stringify(clean));
    return json({ ok: true });

  } catch (err) {
    console.error('schedule POST error:', err);
    return json({ ok: false, error: 'サーバーエラーが発生しました' }, 500);
  }
}
