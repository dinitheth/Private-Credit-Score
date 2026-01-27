/// <reference types="vite/client" />

interface ImportMetaEnv {
    readonly VITE_CREDIT_SCORE_PROGRAM: string
    readonly VITE_CREDIT_SCORE_TX: string
    readonly VITE_LOAN_MANAGER_PROGRAM: string
    readonly VITE_LOAN_MANAGER_TX: string
    readonly VITE_PAYMENT_TRACKER_PROGRAM: string
    readonly VITE_PAYMENT_TRACKER_TX: string
    readonly VITE_ALEO_NETWORK: string
    readonly VITE_ALEO_API_URL: string
    readonly VITE_EXPLORER_URL: string
}

interface ImportMeta {
    readonly env: ImportMetaEnv
}
