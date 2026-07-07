import type {
  APIRequestContext,
  APIResponse,
  BrowserContext,
} from '@playwright/test';
import { expect } from '@playwright/test';

export type E2EUser = {
  name: string;
  email: string;
  password: string;
  token: string;
};

export type E2EOrganization = {
  id: string;
  name: string;
};

export type E2EAcademicYear = {
  id: string;
  name: string;
};

export type E2EClassroom = {
  id: string;
  name: string;
};

export type E2EDegree = {
  id: string;
  name: string;
  code: string;
};

type JsonRecord = Record<string, unknown>;

function isRecord(value: unknown): value is JsonRecord {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function getString(payload: unknown, key: string): string {
  if (!isRecord(payload) || typeof payload[key] !== 'string') {
    throw new Error(`Expected string field "${key}" in API response`);
  }

  return payload[key];
}

async function expectOk(response: APIResponse, context: string) {
  if (!response.ok()) {
    const body = await response.text();
    throw new Error(`${context} failed: ${response.status()} ${body}`);
  }
}

export class E2EApi {
  constructor(
    private readonly request: APIRequestContext,
    private readonly apiBaseUrl: string
  ) {}

  async registerUser(runId: string): Promise<E2EUser> {
    const user = {
      name: `E2E User ${runId}`,
      email: `e2e-${runId}@example.com`,
      password: 'Password123!',
    };

    const response = await this.request.post(
      `${this.apiBaseUrl}/api/auth/register`,
      {
        data: {
          ...user,
          confirmPassword: user.password,
        },
      }
    );
    await expectOk(response, 'register user');
    const payload: unknown = await response.json();

    return {
      ...user,
      token: getString(payload, 'token'),
    };
  }

  async addAuthCookie(context: BrowserContext, token: string) {
    await context.addCookies([
      {
        name: 'auth-token',
        value: token,
        domain: '127.0.0.1',
        path: '/',
        httpOnly: true,
        secure: false,
        sameSite: 'Strict',
        expires: Math.floor(Date.now() / 1000) + 60 * 60 * 24,
      },
    ]);
  }

  async createOrganization(
    token: string,
    name: string
  ): Promise<E2EOrganization> {
    const payload = await this.authenticatedJson(
      token,
      'post',
      '/api/organizations',
      {
        name,
      }
    );

    return {
      id: getString(payload, 'id'),
      name: getString(payload, 'name'),
    };
  }

  async createAcademicYear(
    token: string,
    organizationId: string,
    name: string = '2026-2027'
  ): Promise<E2EAcademicYear> {
    const payload = await this.authenticatedJson(
      token,
      'post',
      `/api/organizations/${organizationId}/academic-years`,
      {
        name,
        periodType: 'semester',
        period0Start: '2026-09-01',
        period0End: '2027-01-31',
        period1Start: '2027-02-01',
        period1End: '2027-06-30',
        centerOpeningTime: '08:00',
        centerClosingTime: '18:00',
        breakDurationMinutes: 30,
        slotDurationMinutes: 60,
      }
    );

    return {
      id: getString(payload, 'id'),
      name: getString(payload, 'name'),
    };
  }

  async createClassroom(
    token: string,
    organizationId: string,
    name: string
  ): Promise<E2EClassroom> {
    const payload = await this.authenticatedJson(
      token,
      'post',
      `/api/organizations/${organizationId}/classrooms`,
      {
        name,
        capacity: 40,
        floor: 1,
        type: 'theory',
      }
    );

    return {
      id: getString(payload, 'id'),
      name: getString(payload, 'name'),
    };
  }

  async createDegree(
    token: string,
    organizationId: string,
    name: string,
    code: string
  ): Promise<E2EDegree> {
    const payload = await this.authenticatedJson(
      token,
      'post',
      `/api/organizations/${organizationId}/degrees`,
      { name, code }
    );

    return {
      id: getString(payload, 'id'),
      name: getString(payload, 'name'),
      code: getString(payload, 'code'),
    };
  }

  async createReservation(
    token: string,
    organizationId: string,
    classroomId: string,
    academicYearId: string,
    reason: string
  ) {
    return this.authenticatedJson(
      token,
      'post',
      `/api/organizations/${organizationId}/classroom-reservations`,
      {
        classroomId,
        academicYearId,
        reason,
        date: '2026-10-05',
        startTimeMinutes: 9 * 60,
        endTimeMinutes: 10 * 60,
      }
    );
  }

  async updateProfileName(token: string, name: string) {
    await this.authenticatedJson(token, 'patch', '/api/users/me', { name });
  }

  async expectHealthy() {
    const response = await this.request.get(`${this.apiBaseUrl}/healthz`);
    await expect(response).toBeOK();
  }

  private async authenticatedJson(
    token: string,
    method: 'post' | 'patch' | 'put' | 'delete',
    path: string,
    data?: JsonRecord
  ): Promise<unknown> {
    const response = await this.request[method](`${this.apiBaseUrl}${path}`, {
      data,
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    await expectOk(response, `${method.toUpperCase()} ${path}`);

    if (response.status() === 204) {
      return {};
    }

    return response.json() as Promise<unknown>;
  }
}
