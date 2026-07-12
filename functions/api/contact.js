/**
 * Cloudflare Pages Function: /api/contact
 * ------------------------------------------------------------
 * お問い合わせフォーム（お問い合わせ／匿名質問／祈りのリクエスト）の
 * 送信を受け取り、メールに変換して転送します。
 *
 * 【設定が必要な項目（Cloudflare Pagesの環境変数）】
 *  - TO_EMAIL   : 受信したいメールアドレス
 *  - FROM_EMAIL : 送信元アドレス（送信ドメインのSPF/DKIM設定が必要）
 *
 * メール送信にはMailChannels（Cloudflare Workers向けの無料送信API）を
 * 例として使っています。Resend等の他サービスを使う場合はfetch先と
 * bodyの形式を書き換えてください。
 * ------------------------------------------------------------
 */

export async function onRequestPost(context) {
  const { request, env } = context;

  try {
    const data = await request.json();
    const name = (data.name || '').trim();
    const email = (data.email || '').trim();
    const message = (data.message || '').trim();
    const kind = data.kind || 'お問い合わせ';

    if (!message) {
      return new Response(JSON.stringify({ ok: false, error: 'メッセージが入力されていません' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const toEmail = env.TO_EMAIL || 'info@chukyo-church.example';
    const fromEmail = env.FROM_EMAIL || 'noreply@chukyo-church.example';
    const nameLine = name ? `${name} 様より` : '（お名前の入力なし・匿名）';

    const mailBody = {
      personalizations: [{ to: [{ email: toEmail }] }],
      from: { email: fromEmail, name: '中京教会サイト' },
      reply_to: { email: email || fromEmail },
      subject: `【中京教会サイト】${kind}`,
      content: [
        {
          type: 'text/plain',
          value: `種別: ${kind}\n${nameLine}\nメール: ${email || '（未入力）'}\n\nメッセージ:\n${message}`
        }
      ]
    };

    const mcRes = await fetch('https://api.mailchannels.net/tx/v1/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(mailBody)
    });

    if (!mcRes.ok) {
      const errText = await mcRes.text();
      console.error('MailChannels error:', errText);
      return new Response(JSON.stringify({ ok: false, error: 'メール送信に失敗しました' }), {
        status: 502,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (err) {
    console.error('contact function error:', err);
    return new Response(JSON.stringify({ ok: false, error: 'サーバーエラーが発生しました' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
