import { WalletContextState } from '@demox-labs/aleo-wallet-adapter-react';
import { Transaction, WalletAdapterNetwork } from '@demox-labs/aleo-wallet-adapter-base';
import { CREDIT_SCORE_PROGRAM, LOAN_MANAGER_PROGRAM } from './constants';

/**
 * Initialize a new credit profile on Aleo blockchain
 */
export async function initializeCreditProfile(wallet: WalletContextState) {
    if (!wallet.publicKey) {
        throw new Error('Wallet not connected');
    }

    if (!wallet.requestTransaction) {
        throw new Error('Wallet does not support requestTransaction');
    }

    try {
        console.log('Creating transaction for initialize_credit on', CREDIT_SCORE_PROGRAM);

        // Create the Aleo transaction using the official API
        const aleoTransaction = Transaction.createTransaction(
            wallet.publicKey,
            WalletAdapterNetwork.TestnetBeta,
            CREDIT_SCORE_PROGRAM,
            'initialize_credit',
            [wallet.publicKey],  // Pass receiver address as input
            100000  // Fee in microcredits
        );

        // Set fee to use public balance instead of private records
        aleoTransaction.feePrivate = false;

        console.log('Requesting transaction:', aleoTransaction);

        // Request the transaction from the wallet
        const transactionId = await wallet.requestTransaction(aleoTransaction);

        console.log('Transaction submitted with ID:', transactionId);
        return { transactionId };
    } catch (error: any) {
        console.error('Error initializing credit profile:', error);
        throw error;
    }
}

/**
 * Apply for a loan on Aleo blockchain
 */
export async function applyForLoan(
    wallet: WalletContextState,
    creditProfile: string,
    loanAmount: number,
    collateralAmount: number,
    termBlocks: number,
    interestRate: number = 500
) {
    if (!wallet.publicKey) {
        throw new Error('Wallet not connected');
    }

    if (!wallet.requestTransaction) {
        throw new Error('Wallet does not support requestTransaction');
    }

    try {
        // Convert amounts to proper Leo format
        const principalMicrocredits = `${loanAmount * 1000000}u64`;
        const collateralMicrocredits = `${collateralAmount * 1000000}u64`;
        const term = `${termBlocks}u32`;
        const rate = `${interestRate}u16`;

        const aleoTransaction = Transaction.createTransaction(
            wallet.publicKey,
            WalletAdapterNetwork.TestnetBeta,
            LOAN_MANAGER_PROGRAM,
            'apply_for_loan',
            [creditProfile, principalMicrocredits, collateralMicrocredits, term, rate],
            150000
        );

        // Use public balance for fees
        aleoTransaction.feePrivate = false;

        const transactionId = await wallet.requestTransaction(aleoTransaction);
        return { transactionId };
    } catch (error) {
        console.error('Error applying for loan:', error);
        throw error;
    }
}

/**
 * Make a payment on a loan
 */
export async function makePayment(
    wallet: WalletContextState,
    loan: string,
    paymentAmount: number
) {
    if (!wallet.publicKey) {
        throw new Error('Wallet not connected');
    }

    if (!wallet.requestTransaction) {
        throw new Error('Wallet does not support requestTransaction');
    }

    try {
        const amountMicrocredits = `${paymentAmount * 1000000}u64`;

        const aleoTransaction = Transaction.createTransaction(
            wallet.publicKey,
            WalletAdapterNetwork.TestnetBeta,
            LOAN_MANAGER_PROGRAM,
            'make_payment',
            [loan, amountMicrocredits],
            100000
        );

        // Use public balance for fees
        aleoTransaction.feePrivate = false;

        const transactionId = await wallet.requestTransaction(aleoTransaction);
        return { transactionId };
    } catch (error) {
        console.error('Error making payment:', error);
        throw error;
    }
}

/**
 * Check if user has a credit profile by querying records
 */
export async function checkHasCreditProfile(
    wallet: WalletContextState
): Promise<boolean> {
    if (!wallet.publicKey || !wallet.requestRecords) {
        return false;
    }

    try {
        const records = await wallet.requestRecords(CREDIT_SCORE_PROGRAM);
        // Check if there are any CreditProfile records
        return records && records.length > 0;
    } catch (error) {
        console.error('Error checking credit profile:', error);
        return false;
    }
}

/**
 * Get credit profile record for display (uses requestRecords - no special permission)
 */
export async function getCreditProfileRecord(wallet: WalletContextState) {
    if (!wallet.publicKey || !wallet.requestRecords) {
        throw new Error('Wallet not connected or does not support requestRecords');
    }

    try {
        const records = await wallet.requestRecords(CREDIT_SCORE_PROGRAM);
        if (!records || records.length === 0) {
            return null;
        }
        return records[0];
    } catch (error) {
        console.error('Error getting credit profile:', error);
        return null;
    }
}

/**
 * Get credit profile plaintext for transactions (uses requestRecordPlaintexts - requires OnChainHistory permission)
 */
export async function getCreditProfilePlaintext(wallet: WalletContextState) {
    if (!wallet.publicKey || !wallet.requestRecordPlaintexts) {
        throw new Error('Wallet not connected or does not support requestRecordPlaintexts');
    }

    try {
        const plaintexts = await wallet.requestRecordPlaintexts(CREDIT_SCORE_PROGRAM);
        if (!plaintexts || plaintexts.length === 0) {
            return null;
        }
        // Parse the first plaintext record as JSON
        console.log('Raw plaintext:', plaintexts[0]);
        const record = JSON.parse(plaintexts[0]);
        return record;
    } catch (error) {
        console.error('Error getting credit profile plaintext:', error);
        throw error; // Throw so user knows permission was denied
    }
}

/**
 * Get active loan records
 */
export async function getActiveLoans(wallet: WalletContextState) {
    if (!wallet.publicKey || !wallet.requestRecords) {
        throw new Error('Wallet not connected or does not support requestRecords');
    }

    try {
        const records = await wallet.requestRecords(LOAN_MANAGER_PROGRAM);
        if (!records || records.length === 0) {
            return [];
        }
        console.log('Loan records fetched:', records);
        return records;
    } catch (error) {
        console.error('Error getting loans:', error);
        return [];
    }
}
