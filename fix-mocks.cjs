const fs = require('fs');
const path = require('path');

const dir = 'backend/src/modules/itinerary/application';
const files = fs
  .readdirSync(dir)
  .filter((f) => f.endsWith('.test.ts'))
  .map((f) => path.join(dir, f));
files.push(
  'backend/src/modules/itinerary/infrastructure/db/drizzle.itinerary.repository.test.ts'
);
files.push(
  'backend/src/modules/itinerary/infrastructure/http/hono.itinerary.controller.test.ts'
);

files.forEach((file) => {
  if (!fs.existsSync(file)) return;
  let content = fs.readFileSync(file, 'utf8');

  if (
    content.includes('findAll: mock()') &&
    !content.includes('findPaginated: mock()')
  ) {
    content = content.replace(
      'findAll: mock(),',
      'findAll: mock(),\n    findPaginated: mock(),'
    );
  }

  if (
    content.includes('findAll: vi.fn()') &&
    !content.includes('findPaginated: vi.fn()')
  ) {
    content = content.replace(
      'findAll: vi.fn(),',
      'findAll: vi.fn(),\n    findPaginated: vi.fn(),'
    );
  }

  if (
    file.includes('hono.itinerary.controller.test.ts') &&
    !content.includes('listAllItinerariesUseCaseMock')
  ) {
    content = content.replace(
      'getItineraryIdentifiersUseCaseMock = { execute: mock() };',
      'getItineraryIdentifiersUseCaseMock = { execute: mock() };\n  const listAllItinerariesUseCaseMock = { execute: mock() };'
    );
    content = content.replace(
      'getItineraryIdentifiersUseCaseMock as any',
      'getItineraryIdentifiersUseCaseMock as any,\n    listAllItinerariesUseCaseMock as any'
    );
  }

  fs.writeFileSync(file, content);
});
