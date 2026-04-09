const axios = require('axios');
const sanitizeHtml = require('sanitize-html');
const { ApiError, StatusCodes } = require('../errors');

function cleanHtml(html) {
  // Pozwalamy na typowe znaczniki SEO/treści, blokujemy skrypty itp.
  return sanitizeHtml(html, {
    allowedTags: [
      'h1','h2','h3','p','ul','ol','li','strong','em','b','i','br',
      'a','span','blockquote'
    ],
    allowedAttributes: {
      a: ['href', 'title', 'rel'],
      span: ['class']
    },
    allowedSchemes: ['http', 'https', 'mailto'],
    transformTags: {
      a: sanitizeHtml.simpleTransform('a', { rel: 'nofollow noopener' })
    }
  });
}

async function generateSeoHtml(product) {
  const apiKey = process.env.GROQ_API_KEY;
  const model = process.env.GROQ_MODEL || 'llama-3.1-8b-instant';

  if (!apiKey) {
    throw new ApiError(
      StatusCodes.INTERNAL_SERVER_ERROR,
      'Brak GROQ_API_KEY w konfiguracji serwera',
      null,
      'CONFIG_ERROR'
    );
  }

  const system = `
Jesteś copywriterem SEO. Wygeneruj opis produktu jako czysty HTML (bez Markdown).
Wymagania:
- Użyj semantycznych nagłówków: 1x <h1>, potem <h2>/<h3>
- Krótkie akapity, lista zalet (<ul>)
- Dodaj sekcję "Najczęstsze pytania" jako <h2> + <ul> (bez danych kontaktowych).
- Nie wymyślaj parametrów. Jeśli czegoś nie wiesz, pomiń.
- Nie dodawaj <script>, <style>, <img>.
- Zwróć TYLKO HTML (bez komentarzy).
`.trim();

  const user = `
Dane produktu z bazy:
Nazwa: ${product.name}
Kategoria: ${product.category_name || '(brak)'}
Cena jednostkowa: ${product.unit_price}
Waga jednostkowa: ${product.unit_weight}
Opis bazowy (może zawierać HTML): ${product.description}
`.trim();

  try {
    const resp = await axios.post(
      'https://api.groq.com/openai/v1/chat/completions',
      {
        model,
        temperature: 0.4,
        max_tokens: 900,
        messages: [
          { role: 'system', content: system },
          { role: 'user', content: user },
        ],
      },
      {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        timeout: 20000,
      }
    );

    const html = resp.data?.choices?.[0]?.message?.content;
    if (!html || typeof html !== 'string') {
      throw new Error('Brak treści w odpowiedzi modelu');
    }

    return cleanHtml(html);
  } catch (e) {
    throw new ApiError(
      StatusCodes.BAD_GATEWAY,
      'Nie udało się wygenerować opisu SEO (błąd usługi LLM)',
      { hint: e?.message },
      'LLM_ERROR'
    );
  }
}

module.exports = { generateSeoHtml };
