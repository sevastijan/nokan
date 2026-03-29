# CRM Leads API

Endpoint do automatycznego przyjmowania leadów z zewnętrznych źródeł (formularze na stronie, landing page, integracje).

## Endpoint

```
POST https://nokan.nkdlab.space/api/crm/leads
```

## Autoryzacja

Klucz API w nagłówku `x-api-key`:

```
x-api-key: crm_3b0b9968758a0d0b3f48948e2f4ce6e1ec49ada5a180b7e80b491e66d9d28c2c
```

## Request

**Content-Type:** `application/json`

### Pola wymagane

| Pole | Typ | Opis |
|------|-----|------|
| `title` | string | Tytuł leada / zapytania |
| `first_name` | string | Imię kontaktu |
| `last_name` | string | Nazwisko kontaktu |

### Pola opcjonalne

| Pole | Typ | Opis |
|------|-----|------|
| `email` | string | Email kontaktu |
| `phone` | string | Telefon kontaktu |
| `position` | string | Stanowisko kontaktu |
| `company_name` | string | Nazwa firmy |
| `company_domain` | string | Domena firmy (np. firma.pl) |
| `company_industry` | string | Branża firmy |
| `value` | number | Szacowana wartość (min) |
| `value_max` | number | Szacowana wartość (max) |
| `currency` | string | Waluta: PLN, EUR, USD (domyślnie PLN) |
| `source` | string | Źródło leada (np. "Strona www", "Landing page") |
| `notes` | string | Dodatkowe informacje |

## Przykład

### cURL

```bash
curl -X POST https://nokan.nkdlab.space/api/crm/leads \
  -H "Content-Type: application/json" \
  -H "x-api-key: crm_3b0b9968758a0d0b3f48948e2f4ce6e1ec49ada5a180b7e80b491e66d9d28c2c" \
  -d '{
    "title": "Zapytanie o stronę www",
    "first_name": "Jan",
    "last_name": "Kowalski",
    "email": "jan@firma.pl",
    "phone": "+48 123 456 789",
    "company_name": "Firma Sp. z o.o.",
    "company_domain": "firma.pl",
    "company_industry": "IT",
    "source": "Strona www",
    "value": 5000,
    "value_max": 10000,
    "currency": "PLN",
    "notes": "Zainteresowany redesignem strony"
  }'
```

### JavaScript (fetch)

```javascript
const response = await fetch('https://nokan.nkdlab.space/api/crm/leads', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'x-api-key': 'crm_3b0b9968758a0d0b3f48948e2f4ce6e1ec49ada5a180b7e80b491e66d9d28c2c',
  },
  body: JSON.stringify({
    title: 'Zapytanie o stronę www',
    first_name: 'Jan',
    last_name: 'Kowalski',
    email: 'jan@firma.pl',
    phone: '+48 123 456 789',
    company_name: 'Firma Sp. z o.o.',
    source: 'Formularz kontaktowy',
    value: 5000,
  }),
});

const data = await response.json();
console.log(data);
```

### Formularz HTML (przykład integracji)

```html
<form id="lead-form">
  <input name="first_name" placeholder="Imię" required />
  <input name="last_name" placeholder="Nazwisko" required />
  <input name="email" type="email" placeholder="Email" />
  <input name="phone" placeholder="Telefon" />
  <input name="company_name" placeholder="Firma" />
  <textarea name="notes" placeholder="Opisz czego potrzebujesz..."></textarea>
  <button type="submit">Wyślij zapytanie</button>
</form>

<script>
document.getElementById('lead-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const form = new FormData(e.target);

  const response = await fetch('https://nokan.nkdlab.space/api/crm/leads', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': 'crm_3b0b9968758a0d0b3f48948e2f4ce6e1ec49ada5a180b7e80b491e66d9d28c2c',
    },
    body: JSON.stringify({
      title: `Zapytanie od ${form.get('first_name')} ${form.get('last_name')}`,
      first_name: form.get('first_name'),
      last_name: form.get('last_name'),
      email: form.get('email'),
      phone: form.get('phone'),
      company_name: form.get('company_name'),
      notes: form.get('notes'),
      source: 'Formularz kontaktowy',
    }),
  });

  if (response.ok) {
    alert('Dziękujemy! Skontaktujemy się wkrótce.');
    e.target.reset();
  } else {
    alert('Wystąpił błąd. Spróbuj ponownie.');
  }
});
</script>
```

## Odpowiedzi

### 201 Created (sukces)

```json
{
  "success": true,
  "deal_id": "uuid",
  "company_id": "uuid",
  "contact_id": "uuid"
}
```

### 400 Bad Request

```json
{
  "error": "Missing required fields: title, first_name, last_name"
}
```

### 401 Unauthorized

```json
{
  "error": "Invalid or missing API key"
}
```

### 500 Internal Server Error

```json
{
  "error": "Failed to create company"
}
```

## Co się dzieje po przyjęciu leada

1. Tworzona jest **firma** (jeśli podano `company_name`)
2. Tworzony jest **kontakt** (powiązany z firmą)
3. Tworzony jest **deal** ze statusem "Lead" i prawdopodobieństwem 10%
4. Kontakt jest linkowany do deala
5. Wszyscy użytkownicy z rolą OWNER otrzymują:
   - Powiadomienie w aplikacji (dzwoneczek)
   - Email z pełnymi szczegółami leada
