const analyzeEnv = import.meta.env.VITE_ENABLE_ANALYZE

export const enableAnalyze =
  analyzeEnv === undefined ? !import.meta.env.PROD : analyzeEnv === 'true'
