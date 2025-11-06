import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

export default ({ mode }) => {
  process.env = { ...process.env, ...loadEnv(mode, process.cwd()) };

  return defineConfig({
    plugins: [react()],
    server: {
      host: true,
      // Tell Vite to send the appropriate CORS headers:
      cors: {
        origin: ['https://www.qubide.cloud'],
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
        // if you need to send cookies or auth headers:
        credentials: true,
      },
      // still include your allowedHosts if you need it for HMR:
      allowedHosts: [
        `${process.env.REPL_ID}.qubide.cloud`,
        'www.qubide.cloud',
      ],
    },
  })
}