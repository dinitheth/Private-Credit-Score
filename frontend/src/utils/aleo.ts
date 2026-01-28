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
    creditProfile: any, // Record object from wallet
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

    // Use the provided record directly - don't call requestRecords() here as it triggers wallet popup
    // The record should already be fetched and passed from the Dashboard component
    try {
        // Convert amounts to proper Leo format
        const principalMicrocredits = `${loanAmount * 1000000}u64`;
        const collateralMicrocredits = `${collateralAmount * 1000000}u64`;
        const term = `${termBlocks}u32`;
        const rate = `${interestRate}u16`;

        // Use the provided record directly
        const creditProfileInput = creditProfile;
        
        // Validate record structure
        if (!creditProfileInput || typeof creditProfileInput !== 'object') {
            throw new Error('Invalid credit profile record: Record must be a valid Aleo record object');
        }
        
        if (!creditProfileInput.id || !creditProfileInput.owner) {
            console.error('Invalid record structure:', creditProfileInput);
            throw new Error('Credit profile record missing required fields (id or owner). Please refresh the page and try again.');
        }
        
        // Check if record is spent (but allow if spent is undefined, as wallet adapter might handle it)
        if (creditProfileInput.spent === true) {
            console.warn('Warning: Credit profile record is marked as spent:', creditProfileInput.id);
            // Don't throw error - let the wallet adapter handle it
            // The wallet adapter may be able to use spent records or will provide a better error
            // throw new Error('Credit profile record has already been spent. Please create a new credit profile or wait for the previous transaction to finalize.');
        }
        
        console.log('Using credit profile record:', {
            id: creditProfileInput.id,
            owner: creditProfileInput.owner,
            program_id: creditProfileInput.program_id,
            spent: creditProfileInput.spent
        });

        // Create transaction inputs array
        // The first input must be the credit profile record (as an object)
        // Subsequent inputs are the loan parameters
        const inputs = [
            creditProfileInput,           // CreditProfile record (object)
            principalMicrocredits,        // Principal amount
            collateralMicrocredits,        // Collateral amount
            term,                          // Term in blocks
            rate                           // Interest rate
        ];

        console.log('Transaction inputs:', {
            recordType: typeof inputs[0],
            recordId: inputs[0]?.id,
            principal: inputs[1],
            collateral: inputs[2],
            term: inputs[3],
            rate: inputs[4]
        });

        const aleoTransaction = Transaction.createTransaction(
            wallet.publicKey,
            WalletAdapterNetwork.TestnetBeta,
            LOAN_MANAGER_PROGRAM,
            'apply_for_loan',
            inputs,
            200000 // Increased fee to ensure transaction goes through
        );

        // Use public balance for fees (not private records)
        aleoTransaction.feePrivate = false;

        console.log('Submitting transaction to wallet...');
        const transactionId = await wallet.requestTransaction(aleoTransaction);
        console.log('Transaction submitted successfully:', transactionId);
        return { transactionId };
    } catch (error) {
        console.error('Error applying for loan:', error);
        throw error;
    }
}

/**
 * Make a payment on a loan
 * Requires loan record object and current block height
 */
export async function makePayment(
    wallet: WalletContextState,
    loanRecord: any, // Loan record object from wallet
    paymentAmount: number
) {
    if (!wallet.publicKey) {
        throw new Error('Wallet not connected');
    }

    if (!wallet.requestTransaction) {
        throw new Error('Wallet does not support requestTransaction');
    }

    if (!loanRecord || typeof loanRecord !== 'object') {
        throw new Error('Invalid loan record: Record must be a valid Aleo record object');
    }

    if (!loanRecord.id || !loanRecord.owner) {
        throw new Error('Loan record missing required fields (id or owner)');
    }

    try {
        const amountMicrocredits = `${paymentAmount * 1000000}u64`;
        
        // Get current block height (approximate - Aleo testnet blocks are ~20 seconds)
        // For now, we'll use a placeholder that the program will handle
        // In production, you'd fetch this from Aleo API
        const currentBlock = `${Math.floor(Date.now() / 20000)}u32`; // Approximate block height

        const inputs = [
            loanRecord,           // Loan record (object)
            amountMicrocredits,   // Payment amount
            currentBlock          // Current block height
        ];

        console.log('Making payment with inputs:', {
            loanId: loanRecord.id,
            amount: amountMicrocredits,
            currentBlock
        });

        const aleoTransaction = Transaction.createTransaction(
            wallet.publicKey,
            WalletAdapterNetwork.TestnetBeta,
            LOAN_MANAGER_PROGRAM,
            'make_payment',
            inputs,
            200000 // Increased fee
        );

        // Use public balance for fees
        aleoTransaction.feePrivate = false;

        const transactionId = await wallet.requestTransaction(aleoTransaction);
        console.log('Payment transaction submitted:', transactionId);
        return { transactionId };
    } catch (error) {
        console.error('Error making payment:', error);
        throw error;
    }
}

// Cache for records to avoid multiple wallet popups
let recordsCache: { records: any[] | null; timestamp: number } = { records: null, timestamp: 0 };
const CACHE_DURATION = 30000; // 30 seconds cache

/**
 * Get credit profile records (cached to prevent multiple wallet popups)
 * This function fetches records once and caches them for a short period
 */
async function getCreditProfileRecordsCached(wallet: WalletContextState): Promise<any[] | null> {
    if (!wallet.publicKey || !wallet.requestRecords) {
        return null;
    }

    // Return cached records if still valid
    const now = Date.now();
    if (recordsCache.records && (now - recordsCache.timestamp) < CACHE_DURATION) {
        console.log('Using cached credit profile records');
        return recordsCache.records;
    }

    try {
        console.log('Fetching credit profile records from wallet (this will trigger one popup)...');
        const records = await wallet.requestRecords(CREDIT_SCORE_PROGRAM);
        
        // Cache the records
        recordsCache = {
            records: records && records.length > 0 ? records : null,
            timestamp: now
        };
        
        return recordsCache.records;
    } catch (error) {
        console.error('Error fetching credit profile records:', error);
        return null;
    }
}

/**
 * Clear the records cache (call this after transactions that might create new records)
 */
export function clearRecordsCache() {
    recordsCache = { records: null, timestamp: 0 };
    console.log('Records cache cleared');
}

/**
 * Check if user has a credit profile by querying records (uses cache)
 */
export async function checkHasCreditProfile(
    wallet: WalletContextState
): Promise<boolean> {
    const records = await getCreditProfileRecordsCached(wallet);
    return records !== null && records.length > 0;
}

/**
 * Get credit profile record for display (uses cached records - only one wallet popup)
 * Prioritizes unspent records, but will return spent records if no unspent ones exist
 * Returns the encrypted record object - decryption happens in the component if needed
 */
export async function getCreditProfileRecord(wallet: WalletContextState, forceRefresh: boolean = false) {
    if (!wallet.publicKey || !wallet.requestRecords) {
        throw new Error('Wallet not connected or does not support requestRecords');
    }

    // If force refresh, clear cache first
    if (forceRefresh) {
        recordsCache = { records: null, timestamp: 0 };
    }

    const records = await getCreditProfileRecordsCached(wallet);
    
    if (!records || records.length === 0) {
        return null;
    }
    
    // Find an unspent record (spent: false or undefined)
    const unspentRecord = records.find((r: any) => r.spent === false || r.spent === undefined);
    
    if (unspentRecord) {
        console.log('Found unspent credit profile record:', unspentRecord.id);
        return unspentRecord;
    }
    
    // If no unspent record found, check all records
    console.warn('No unspent record found. All records:', records.map((r: any) => ({ id: r.id, spent: r.spent })));
    
    // Return the most recent record (last in array, or first if wallet returns newest first)
    // The wallet adapter should handle spent records in transactions
    const recordToUse = records[records.length - 1] || records[0];
    console.warn('Using record (may be spent):', recordToUse.id, 'spent:', recordToUse.spent);
    return recordToUse;
}

/**
 * Request decryption permission and decrypt credit profile record
 * This will trigger a wallet popup asking for permission
 */
export async function requestDecryption(wallet: WalletContextState): Promise<boolean> {
    if (!wallet.publicKey || !wallet.requestRecordPlaintexts) {
        console.warn('Wallet does not support requestRecordPlaintexts');
        return false;
    }

    try {
        // Request decryption permission - this will show wallet popup
        const plaintexts = await wallet.requestRecordPlaintexts(CREDIT_SCORE_PROGRAM);
        return plaintexts !== null && plaintexts.length > 0;
    } catch (error: any) {
        const errorMessage = error?.message || String(error);
        const isPermissionError = error?.name === 'WalletRecordsError' || 
                                 /permission.*not.*granted|not.*granted/i.test(errorMessage);
        
        if (isPermissionError) {
            console.log('Decryption permission denied by user');
            return false;
        }
        console.error('Error requesting decryption:', error);
        return false;
    }
}

/**
 * Decrypt credit profile record to get plaintext data
 * This requires user permission via wallet adapter
 */
export async function decryptCreditProfileRecord(wallet: WalletContextState, record: any): Promise<CreditProfileData | null> {
    if (!wallet.publicKey || !wallet.requestRecordPlaintexts) {
        console.warn('Wallet does not support requestRecordPlaintexts - cannot decrypt record');
        return null;
    }

    try {
        // Request decryption of the specific record
        // Note: This may require user approval in wallet
        const plaintexts = await wallet.requestRecordPlaintexts(CREDIT_SCORE_PROGRAM);
        
        if (!plaintexts || plaintexts.length === 0) {
            return null;
        }

        // Find the matching plaintext record by ID
        for (const plaintext of plaintexts) {
            try {
                const parsed = typeof plaintext === 'string' ? JSON.parse(plaintext) : plaintext;
                
                // Match by record ID or owner
                if (parsed.id === record.id || parsed.owner === record.owner) {
                    return {
                        score: parsed.score || 600,
                        payment_count: parsed.payment_count || 0,
                        on_time_payments: parsed.on_time_payments || 0,
                        late_payments: parsed.late_payments || 0,
                        defaults: parsed.defaults || 0,
                        total_borrowed: parsed.total_borrowed || 0,
                        total_repaid: parsed.total_repaid || 0,
                    };
                }
            } catch (e) {
                console.warn('Error parsing plaintext:', e);
            }
        }

        return null;
    } catch (error: any) {
        // Check if this is a permission denied error
        const errorMessage = error?.message || String(error);
        const isPermissionError = error?.name === 'WalletRecordsError' || 
                                 /permission.*not.*granted|not.*granted/i.test(errorMessage);
        
        if (isPermissionError) {
            // Permission denied is expected - user needs to approve decryption
            console.log('Decryption permission not granted - user needs to approve in wallet');
        } else {
            console.error('Error decrypting credit profile:', error);
        }
        
        // Return null if decryption fails (user may have denied permission)
        return null;
    }
}

interface CreditProfileData {
    score: number;
    payment_count: number;
    on_time_payments: number;
    late_payments: number;
    defaults: number;
    total_borrowed: number;
    total_repaid: number;
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
 * Get active loan records from blockchain
 * Returns encrypted loan records - decryption happens in component if needed
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
        
        // Filter for unspent loan records (active loans)
        const activeRecords = records.filter((r: any) => r.spent === false || r.spent === undefined);
        return activeRecords;
    } catch (error) {
        console.error('Error getting loans:', error);
        return [];
    }
}

/**
 * Decrypt loan record to get plaintext data
 * This requires user permission via wallet adapter
 */
export async function decryptLoanRecord(wallet: WalletContextState, record: any): Promise<LoanData | null> {
    if (!wallet.publicKey || !wallet.requestRecordPlaintexts) {
        console.warn('Wallet does not support requestRecordPlaintexts - cannot decrypt loan record');
        return null;
    }

    try {
        const plaintexts = await wallet.requestRecordPlaintexts(LOAN_MANAGER_PROGRAM);
        
        if (!plaintexts || plaintexts.length === 0) {
            return null;
        }

        // Find the matching plaintext record
        for (const plaintext of plaintexts) {
            try {
                const parsed = typeof plaintext === 'string' ? JSON.parse(plaintext) : plaintext;
                
                // Match by record ID or loan_id
                if (parsed.id === record.id || parsed.loan_id === record.loan_id) {
                    return {
                        id: parsed.loan_id || parsed.id || '',
                        principal: parsed.principal ? Number(parsed.principal) / 1000000 : 0,
                        collateral: parsed.collateral ? Number(parsed.collateral) / 1000000 : 0,
                        remainingBalance: parsed.remaining_balance ? Number(parsed.remaining_balance) / 1000000 : 0,
                        nextPaymentDue: parsed.next_payment_due || 0,
                        status: parsed.status || 0,
                        paymentsMade: parsed.payments_made || 0,
                        termBlocks: parsed.term_blocks || 0,
                        interestRate: parsed.interest_rate || 500,
                    };
                }
            } catch (e) {
                console.warn('Error parsing loan plaintext:', e);
            }
        }

        return null;
    } catch (error: any) {
        // Check if this is a permission denied error
        const errorMessage = error?.message || String(error);
        const isPermissionError = error?.name === 'WalletRecordsError' || 
                                 /permission.*not.*granted|not.*granted/i.test(errorMessage);
        
        if (isPermissionError) {
            // Permission denied is expected - user needs to approve decryption
            console.log('Loan decryption permission not granted - user needs to approve in wallet');
        } else {
            console.error('Error decrypting loan record:', error);
        }
        
        return null;
    }
}

interface LoanData {
    id: string;
    principal: number;
    collateral: number;
    remainingBalance: number;
    nextPaymentDue: number;
    status: number;
    paymentsMade: number;
    termBlocks: number;
    interestRate: number;
}
