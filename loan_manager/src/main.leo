// ================================================
// Undercollateralized Loan Manager
// ================================================
// Enables loans based on ZK-verified credit scores
// Supports dynamic collateral ratios based on creditworthiness

// Import credit score program for verification
import credit_score.aleo;

program loan_managerv1.aleo {
    
    // ============================================
    // DATA STRUCTURES
    // ============================================
    
    // Private loan record
    record Loan {
        owner: address,              // Borrower address
        loan_id: field,              // Unique loan identifier
        principal: u64,              // Original loan amount (microcredits)
        collateral: u64,             // Collateral deposited (microcredits)
        interest_rate: u16,          // Annual rate in basis points (500 = 5%)
        term_blocks: u32,            // Loan duration in blocks
        issued_height: u32,          // Block when loan was issued
        next_payment_due: u32,       // Next payment deadline (block height)
        remaining_balance: u64,      // Current outstanding amount
        payments_made: u8,           // Number of payments completed
        status: u8,                  // 0=active, 1=paid_off, 2=defaulted
    }
    
    // Collateral deposit record
    record Collateral {
        owner: address,
        loan_id: field,
        amount: u64,
        locked: bool,    // True if still securing loan
    }
    
    // ============================================
    // PUBLIC MAPPINGS
    // ============================================
    
    // Track total loans issued (anonymous statistics)
    mapping total_loans: u8 => u32;
    
    // Track total volume (in microcredits)
    mapping total_volume: u8 => u64;
    
    // Default rate tracking (basis points)
    mapping default_rate: u8 => u16;
    
    // Active loans per user (prevent over-borrowing)
    mapping user_active_loans: address => u8;
    
    // ============================================
    // CONSTRUCTOR - Required for Consensus V9+
    // ============================================
    
    @noupgrade
    async constructor() {
        // Leo compiler automatically generates initialization logic
    }
    
    // ============================================
    // TRANSITIONS
    // ============================================
    
    /**
     * Apply for undercollateralized loan
     * Requires ZK proof of credit score threshold
     * Collateral requirement based on creditworthiness
     */
    async transition apply_for_loan(
        credit_profile: credit_score.aleo/CreditProfile,
        public principal_amount: u64,
        public collateral_amount: u64,
        public term_blocks: u32,
        public interest_rate: u16
    ) -> (Loan, Collateral, Future) {
        
        // Generate unique loan ID
        let loan_id: field = BHP256::hash_to_field(credit_profile.owner);
        
        // Verify collateral meets minimum requirement
        let required_collateral_ratio: u16 = credit_score.aleo/calculate_collateral_ratio(credit_profile);
        let required_collateral: u64 = (principal_amount * (required_collateral_ratio as u64)) / 10000u64;
        
        assert(collateral_amount >= required_collateral);
        
        // Create loan record
        // FIXED: Can't use block.height in transition
        let new_loan: Loan = Loan {
            owner: credit_profile.owner,
            loan_id: loan_id,
            principal: principal_amount,
            collateral: collateral_amount,
            interest_rate: interest_rate,
            term_blocks: term_blocks,
            issued_height: 0u32,        // FIXED: Changed from block.height
            next_payment_due: term_blocks / 12u32,  // FIXED: Relative blocks
            remaining_balance: principal_amount,
            payments_made: 0u8,
            status: 0u8,  // Active
        };
        
        // Lock collateral
        let collateral_record: Collateral = Collateral {
            owner: credit_profile.owner,
            loan_id: loan_id,
            amount: collateral_amount,
            locked: true,
        };
        
        return (new_loan, collateral_record, finalize_loan_issuance(credit_profile.owner, principal_amount));
    }
    
    async function finalize_loan_issuance(
        borrower: address,
        amount: u64
    ) {
        // Update total loans count
        let current_loans: u32 = Mapping::get_or_use(total_loans, 0u8, 0u32);
        Mapping::set(total_loans, 0u8, current_loans + 1u32);
        
        // Update total volume
        let current_volume: u64 = Mapping::get_or_use(total_volume, 0u8, 0u64);
        Mapping::set(total_volume, 0u8, current_volume + amount);
        
        // Track user active loans
        let user_loans: u8 = Mapping::get_or_use(user_active_loans, borrower, 0u8);
        Mapping::set(user_active_loans, borrower, user_loans + 1u8);
    }
    
    
    /**
     * Make payment on active loan
     * Updates remaining balance and payment tracking
     * Returns updated loan record and payment confirmation
     */
    async transition make_payment(
        loan: Loan,
        public payment_amount: u64,
        public current_block: u32  // FIXED: Pass current block as parameter
    ) -> (Loan, u8, Future) {
        
        // Verify loan is active
        assert(loan.status == 0u8);
        
        // Calculate new balance
        let new_balance: u64 = 0u64;
        if loan.remaining_balance > payment_amount {
            new_balance = loan.remaining_balance - payment_amount;
        }
        
        // Determine payment status
        let payment_status: u8 = 0u8;  // On-time
        if current_block > loan.next_payment_due {
            payment_status = 1u8;  // Late
        }
        
        // Update loan record
        let updated_loan: Loan = Loan {
            owner: loan.owner,
            loan_id: loan.loan_id,
            principal: loan.principal,
            collateral: loan.collateral,
            interest_rate: loan.interest_rate,
            term_blocks: loan.term_blocks,
            issued_height: loan.issued_height,
            next_payment_due: loan.next_payment_due + (loan.term_blocks / 12u32),
            remaining_balance: new_balance,
            payments_made: loan.payments_made + 1u8,
            status: new_balance == 0u64 ? 1u8 : 0u8,  // Paid off or still active
        };
        
        return (updated_loan, payment_status, finalize_make_payment());
    }
    
    async function finalize_make_payment() {
        // Placeholder finalize
    }
    
    
    /**
     * Mark loan as defaulted
     * Triggered when payment significantly overdue
     * Collateral can be liquidated
     */
    async transition mark_default(
        loan: Loan,
        collateral: Collateral,
        public current_block: u32  // FIXED: Pass current block as parameter
    ) -> (Loan, Collateral, Future) {
        
        // Verify loan is active
        assert(loan.status == 0u8);
        
        // Verify payment is overdue (>30 blocks past due date)
        assert(current_block > loan.next_payment_due + 30u32);
        
        // Update loan status to defaulted
        let defaulted_loan: Loan = Loan {
            owner: loan.owner,
            loan_id: loan.loan_id,
            principal: loan.principal,
            collateral: loan.collateral,
            interest_rate: loan.interest_rate,
            term_blocks: loan.term_blocks,
            issued_height: loan.issued_height,
            next_payment_due: loan.next_payment_due,
            remaining_balance: loan.remaining_balance,
            payments_made: loan.payments_made,
            status: 2u8,  // Defaulted
        };
        
        // Unlock collateral for liquidation
        let released_collateral: Collateral = Collateral {
            owner: collateral.owner,
            loan_id: collateral.loan_id,
            amount: collateral.amount,
            locked: false,
        };
        
        return (defaulted_loan, released_collateral, finalize_default(loan.owner));
    }
    
    async function finalize_default(
        borrower: address
    ) {
        // Update default statistics
        let current_defaults: u32 = Mapping::get_or_use(total_loans, 1u8, 0u32);
        Mapping::set(total_loans, 1u8, current_defaults + 1u32);
        
        // Update user active loans
        let user_loans: u8 = Mapping::get_or_use(user_active_loans, borrower, 0u8);
        if user_loans > 0u8 {
            Mapping::set(user_active_loans, borrower, user_loans - 1u8);
        }
    }
    
    
    /**
     * Release collateral after loan paid off
     * Returns collateral to borrower
     */
    transition release_collateral(
        loan: Loan,
        collateral: Collateral
    ) -> Collateral {
        
        // Verify loan is paid off
        assert(loan.status == 1u8);
        assert(loan.remaining_balance == 0u64);
        
        // Verify collateral belongs to this loan
        assert(collateral.loan_id == loan.loan_id);
        
        // Release collateral
        let released: Collateral = Collateral {
            owner: collateral.owner,
            loan_id: collateral.loan_id,
            amount: collateral.amount,
            locked: false,
        };
        
        return released;
    }
    
    
    /**
     * Calculate minimum payment amount
     * Based on principal, interest rate, and term
     */
    inline calculate_min_payment(
        principal: u64,
        interest_rate: u16
    ) -> u64 {
        
        // Simple calculation: (principal + interest) / 12 months
        let total_interest: u64 = (principal * (interest_rate as u64)) / 10000u64;
        let total_due: u64 = principal + total_interest;
        let monthly_payment: u64 = total_due / 12u64;
        
        return monthly_payment;
    }
}
