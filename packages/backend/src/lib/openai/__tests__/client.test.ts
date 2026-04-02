import {
  callOpenAI,
  MSG_AI_NOT_AVAILABLE,
  MSG_AI_PARSE_FAILED,
  type OpenAICallOptions,
} from '../client';

// ── Helpers ───────────────────────────────────────────────────────────────────

const makeOptions = (overrides: Partial<OpenAICallOptions> = {}): OpenAICallOptions => ({
  systemText: 'You are a helpful assistant.',
  userText: 'Parse this expense.',
  jsonSchema: { name: 'expense', schema: { type: 'object' } },
  apiKey: 'test-api-key',
  model: 'gpt-4o',
  ...overrides,
});

/** Builds a mock fetch Response that is ok (200) and returns JSON. */
const mockOkResponse = (data: unknown) =>
  Promise.resolve({
    ok: true,
    status: 200,
    json: () => Promise.resolve(data),
  } as Response);

/** Builds a mock fetch Response that is not ok. */
const mockErrorResponse = (status: number, body: unknown = {}) =>
  Promise.resolve({
    ok: false,
    status,
    text: () => Promise.resolve(typeof body === 'string' ? body : JSON.stringify(body)),
  } as Response);

// ── Setup ─────────────────────────────────────────────────────────────────────

const fetchMock = jest.fn();

beforeAll(() => {
  global.fetch = fetchMock;
});

beforeEach(() => {
  fetchMock.mockReset();
});

// alias so every test can reference fetchSpy without changing any assertions
const fetchSpy = fetchMock;

// ── Request construction ───────────────────────────────────────────────────────

describe('request construction', () => {
  it('calls the OpenAI Responses API endpoint', async () => {
    fetchSpy.mockReturnValue(mockOkResponse({ output_text: JSON.stringify({ amount: 10 }) }));

    await callOpenAI(makeOptions());

    expect(fetchSpy).toHaveBeenCalledWith(
      'https://api.openai.com/v1/responses',
      expect.objectContaining({ method: 'POST' }),
    );
  });

  it('sets Authorization and Content-Type headers', async () => {
    fetchSpy.mockReturnValue(mockOkResponse({ output_text: JSON.stringify({}) }));

    await callOpenAI(makeOptions({ apiKey: 'sk-secret' }));

    const [, init] = fetchSpy.mock.calls[0] as [string, RequestInit];
    expect(init.headers).toMatchObject({
      Authorization: 'Bearer sk-secret',
      'Content-Type': 'application/json',
    });
  });

  it('embeds model, systemText, userText, and jsonSchema in the request body', async () => {
    fetchSpy.mockReturnValue(mockOkResponse({ output_text: JSON.stringify({}) }));

    await callOpenAI(
      makeOptions({
        model: 'gpt-4o-mini',
        systemText: 'sys',
        userText: 'usr',
        jsonSchema: { name: 'mySchema', schema: { type: 'object', properties: {} } },
      }),
    );

    const [, init] = fetchSpy.mock.calls[0] as [string, RequestInit];
    const body = JSON.parse(init.body as string);

    expect(body.model).toBe('gpt-4o-mini');
    expect(body.input[0].role).toBe('system');
    expect(body.input[0].content[0].text).toBe('sys');
    expect(body.input[1].role).toBe('user');
    expect(body.input[1].content[0].text).toBe('usr');
    expect(body.text.format.name).toBe('mySchema');
    expect(body.text.format.type).toBe('json_schema');
  });
});

// ── Successful response parsing ───────────────────────────────────────────────

describe('successful responses', () => {
  it('parses and returns data from top-level output_text', async () => {
    const payload = { amount: 42, currency: 'USD' };
    fetchSpy.mockReturnValue(mockOkResponse({ output_text: JSON.stringify(payload) }));

    const result = await callOpenAI<typeof payload>(makeOptions());

    expect(result).toEqual(payload);
  });

  it('parses and returns data from nested output[0].content[].text', async () => {
    const payload = { amount: 9.99 };
    fetchSpy.mockReturnValue(
      mockOkResponse({
        output: [{ content: [{ type: 'output_text', text: JSON.stringify(payload) }] }],
      }),
    );

    const result = await callOpenAI<typeof payload>(makeOptions());

    expect(result).toEqual(payload);
  });

  it('prefers output_text over the nested output path', async () => {
    const primary = { source: 'output_text' };
    const secondary = { source: 'nested' };
    fetchSpy.mockReturnValue(
      mockOkResponse({
        output_text: JSON.stringify(primary),
        output: [{ content: [{ text: JSON.stringify(secondary) }] }],
      }),
    );

    const result = await callOpenAI<typeof primary>(makeOptions());

    expect(result).toEqual(primary);
  });

  it('returns null when output_text is an empty string and nested output is absent', async () => {
    fetchSpy.mockReturnValue(mockOkResponse({ output_text: '' }));

    const result = await callOpenAI(makeOptions());

    expect(result).toBeNull();
  });

  it('returns null when output field is missing and output_text is absent', async () => {
    fetchSpy.mockReturnValue(mockOkResponse({}));

    const result = await callOpenAI(makeOptions());

    expect(result).toBeNull();
  });

  it('throws MSG_AI_PARSE_FAILED with statusCode 502 when output_text is invalid JSON', async () => {
    fetchSpy.mockReturnValue(mockOkResponse({ output_text: 'not-json{{' }));

    await expect(callOpenAI(makeOptions())).rejects.toMatchObject({
      message: MSG_AI_PARSE_FAILED,
      statusCode: 502,
    });
  });
});

// ── HTTP error handling ───────────────────────────────────────────────────────

describe('HTTP error responses', () => {
  it('throws MSG_AI_NOT_AVAILABLE with statusCode 502 on 401', async () => {
    fetchSpy.mockReturnValue(mockErrorResponse(401));

    await expect(callOpenAI(makeOptions())).rejects.toMatchObject({
      message: MSG_AI_NOT_AVAILABLE,
      statusCode: 502,
    });
  });

  it('throws MSG_AI_NOT_AVAILABLE with statusCode 502 on 403', async () => {
    fetchSpy.mockReturnValue(mockErrorResponse(403));

    await expect(callOpenAI(makeOptions())).rejects.toMatchObject({
      message: MSG_AI_NOT_AVAILABLE,
      statusCode: 502,
    });
  });

  it('throws "Too many requests" with statusCode 429 on 429', async () => {
    fetchSpy.mockReturnValue(mockErrorResponse(429));

    await expect(callOpenAI(makeOptions())).rejects.toMatchObject({
      message: 'Too many requests. Please wait a moment and try again.',
      statusCode: 429,
    });
  });

  it('throws "temporarily unavailable" message with statusCode 502 on 500', async () => {
    fetchSpy.mockReturnValue(mockErrorResponse(500));

    await expect(callOpenAI(makeOptions())).rejects.toMatchObject({
      message: 'The parsing service is temporarily unavailable. Please try again in a moment or enter the details manually.',
      statusCode: 502,
    });
  });

  it('throws MSG_AI_PARSE_FAILED with statusCode 502 for unrecognised 4xx', async () => {
    fetchSpy.mockReturnValue(mockErrorResponse(422));

    await expect(callOpenAI(makeOptions())).rejects.toMatchObject({
      message: MSG_AI_PARSE_FAILED,
      statusCode: 502,
    });
  });
});

// ── Error code handling ───────────────────────────────────────────────────────

describe('OpenAI error code handling', () => {
  const errorBody = (code: string, type?: string) =>
    JSON.stringify({ error: { message: 'details', code, type: type ?? 'api_error' } });

  it('throws MSG_AI_PARSE_FAILED for code model_not_found', async () => {
    fetchSpy.mockReturnValue(mockErrorResponse(404, errorBody('model_not_found')));

    await expect(callOpenAI(makeOptions())).rejects.toMatchObject({ message: MSG_AI_PARSE_FAILED });
  });

  it('throws MSG_AI_PARSE_FAILED for code invalid_model', async () => {
    fetchSpy.mockReturnValue(mockErrorResponse(400, errorBody('invalid_model')));

    await expect(callOpenAI(makeOptions())).rejects.toMatchObject({ message: MSG_AI_PARSE_FAILED });
  });

  it('throws MSG_AI_NOT_AVAILABLE for code insufficient_quota', async () => {
    // Status 402 avoids the earlier status===429 branch so the code check is reached
    fetchSpy.mockReturnValue(mockErrorResponse(402, errorBody('insufficient_quota')));

    await expect(callOpenAI(makeOptions())).rejects.toMatchObject({
      message: MSG_AI_NOT_AVAILABLE,
    });
  });

  it('throws MSG_AI_NOT_AVAILABLE for code billing_hard_limit_reached', async () => {
    fetchSpy.mockReturnValue(mockErrorResponse(402, errorBody('billing_hard_limit_reached')));

    await expect(callOpenAI(makeOptions())).rejects.toMatchObject({
      message: MSG_AI_NOT_AVAILABLE,
    });
  });

  it('throws "text is too long" message for code context_length_exceeded', async () => {
    fetchSpy.mockReturnValue(mockErrorResponse(400, errorBody('context_length_exceeded')));

    await expect(callOpenAI(makeOptions())).rejects.toMatchObject({
      message: 'That text is too long to parse. Try a shorter description.',
    });
  });

  it('throws MSG_AI_PARSE_FAILED for type invalid_request_error on 4xx', async () => {
    fetchSpy.mockReturnValue(
      mockErrorResponse(400, errorBody('unknown_code', 'invalid_request_error')),
    );

    await expect(callOpenAI(makeOptions())).rejects.toMatchObject({ message: MSG_AI_PARSE_FAILED });
  });

  it('falls back to MSG_AI_PARSE_FAILED for unknown error code on 4xx', async () => {
    fetchSpy.mockReturnValue(mockErrorResponse(400, errorBody('totally_unknown')));

    await expect(callOpenAI(makeOptions())).rejects.toMatchObject({ message: MSG_AI_PARSE_FAILED });
  });

  it('gracefully handles a non-JSON error body', async () => {
    fetchSpy.mockReturnValue(mockErrorResponse(400, 'not-json'));

    await expect(callOpenAI(makeOptions())).rejects.toMatchObject({ message: MSG_AI_PARSE_FAILED });
  });
});
