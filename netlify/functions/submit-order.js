const FORM_URL = 'https://docs.google.com/forms/d/e/1FAIpQLSdLsFLIcroEl4Is9mHcSZe9XQNn24ZPMpHaJKysaH4HSVu7rw/formResponse';

exports.handler = async function(event) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    const body = JSON.parse(event.body);

    const params = new URLSearchParams();

    // 花品
    const productVal = body.product_code
      ? `${body.product_code}｜${body.product_name}`
      : (body.product_name || '');
    params.append('entry.567590873', productVal);

    // 一般欄位
    const ENTRY = {
      name:           'entry.1189320189',
      phone:          'entry.1723132794',
      email:          'entry.320327010',
      contact_pref:   'entry.665664456',
      occasion:       'entry.886644767',
      budget:         'entry.435939657',
      style_pref:     'entry.556980663',
      delivery:       'entry.899760506',
      time_slot:      'entry.467678299',
      recipient_name: 'entry.1615028174',
      recipient_phone:'entry.1907914262',
      address:        'entry.844656417',
      payment:        'entry.894974780',
      note:           'entry.1037644282',
    };

    for (const [key, entryId] of Object.entries(ENTRY)) {
      params.append(entryId, body[key] || '');
    }

    // 日期（年月日分開）
    if (body.date) {
      const [y, m, d] = body.date.split('-');
      params.append('entry.1085798317_year', y);
      params.append('entry.1085798317_month', m);
      params.append('entry.1085798317_day', d);
    }

    await fetch(FORM_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params.toString()
    });

    return {
      statusCode: 200,
      body: JSON.stringify({ success: true })
    };

  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({ success: false, error: err.message })
    };
  }
};
