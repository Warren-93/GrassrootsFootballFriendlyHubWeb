// Mirrors the mobile client's ApiResult<T> - every repository call returns
// this instead of throwing, so screens never need try/catch for network
// failures, only a switch on `ok`.
export type ApiResult<T> = { ok: true; value: T } | { ok: false; message: string; status?: number };

export function ok<T>(value: T): ApiResult<T> {
  return { ok: true, value };
}

export function fail<T = never>(message: string, status?: number): ApiResult<T> {
  return { ok: false, message, status };
}
