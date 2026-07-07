if (Bun.env.E2E_SERVER === 'true') {
  const { serverConfig } = await import('./app');

  Bun.serve(serverConfig);
}
