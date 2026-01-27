// ================================================
// Private Credit Score System
// ================================================
// Enables privacy-preserving credit scoring with ZK proofs
// Users can prove creditworthiness without revealing exact scores

program credit_score.aleo {
    
    // ============================================
    // STRUCTS (Must be declared FIRST)
    // ============================================
    
    // Payment event structure for score updates
    struct PaymentEvent {
        payment_type: u8,     // 0=on_time, 1=late, 2=default
        amount: u64,          // Payment amount
        timestamp: u32,       // Block height
    }
    
    // ============================================
    // DATA STRUCTURES
    // ============================================
    
    // Private credit profile record
    // Contains all credit-related data encrypted for the user
    record CreditProfile {
        owner: address,
        score: u16,              // Credit score (300-850 range)
        payment_count: u8,        // Total number of payments made
        on_time_payments: u8,     // Successful on-time payments
        late_payments: u8,        // Late payment count
        defaults: u8,             // Default count (severely impacts score)
        total_borrowed: u64,      // Lifetime borrowing amount (microcredits)
        total_repaid: u64,        // Lifetime repayments (microcredits)
        last_updated: u32,        // Block height of last update
    }
    
    // ============================================
    // PUBLIC MAPPINGS
    // ============================================
    
    // Track verified borrowers (public, but score remains private)
    mapping verified_borrowers: address => bool;
    
    // Anonymous statistics (for ecosystem health monitoring)
    mapping total_users: u8 => u32;
    mapping average_score_range: u8 => u16;  // 0=300-500, 1=500-650, 2=650-750, 3=750-850
    
    // ============================================
    // CONSTRUCTOR - Required for Consensus V9+
    // ============================================
    
    @noupgrade
    async constructor() {
        // Leo compiler automatically generates initialization logic
    }
    
    // ============================================
    // TRANSITIONS (PUBLIC FUNCTIONS)
    // ============================================
    
    /**
     * Initialize a new credit profile
     * Starting score: 600 (neutral baseline)
     * Anyone can create a profile to start building credit
     */
    async transition initialize_credit(
        public receiver: address
    ) -> (CreditProfile, Future) {
        
        // Create initial credit profile with baseline score
        // FIXED: Can't use block.height in transition, will be set in finalize
        let new_profile: CreditProfile = CreditProfile {
            owner: receiver,
            score: 600u16,           // Starting score
            payment_count: 0u8,
            on_time_payments: 0u8,
            late_payments: 0u8,
            defaults: 0u8,
            total_borrowed: 0u64,
            total_repaid: 0u64,
            last_updated: 0u32,      // FIXED: Changed from block.height
        };
        
        return (new_profile, finalize_initialize_credit());
    }
    
    async function finalize_initialize_credit() {
        // Can access block.height here if needed for tracking
        // For now, just a placeholder finalize
    }
    
    
    /**
     * Update credit score based on payment event
     * Recalculates score using weighted factors
     * Privacy: Input record encrypted, new score private
     */
    async transition update_score(
        credit_profile: CreditProfile,
        payment_event: PaymentEvent,
        loan_amount: u64
    ) -> (CreditProfile, Future) {
        
        // Update payment counters
        let new_payment_count: u8 = credit_profile.payment_count + 1u8;
        let new_on_time: u8 = credit_profile.on_time_payments;
        let new_late: u8 = credit_profile.late_payments;
        let new_defaults: u8 = credit_profile.defaults;
        
        // Update based on payment type
        if payment_event.payment_type == 0u8 {
            // On-time payment
            new_on_time = new_on_time + 1u8;
        } else {
            if payment_event.payment_type == 1u8 {
                // Late payment
                new_late = new_late + 1u8;
            } else {
                // Default
                new_defaults = new_defaults + 1u8;
            }
        }
        
        // Update loan tracking
        let new_total_borrowed: u64 = credit_profile.total_borrowed + loan_amount;
        let new_total_repaid: u64 = credit_profile.total_repaid + payment_event.amount;
        
        // Calculate new score
        let new_score: u16 = calculate_score(
            new_on_time,
            new_late,
            new_defaults,
            new_total_borrowed,
            new_total_repaid
        );
        
        // Create updated profile
        // FIXED: Can't use block.height in transition
        let updated_profile: CreditProfile = CreditProfile {
            owner: credit_profile.owner,
            score: new_score,
            payment_count: new_payment_count,
            on_time_payments: new_on_time,
            late_payments: new_late,
            defaults: new_defaults,
            total_borrowed: new_total_borrowed,
            total_repaid: new_total_repaid,
            last_updated: 0u32,      // FIXED: Changed from block.height
        };
        
        return (updated_profile, finalize_update_score());
    }
    
    async function finalize_update_score() {
        // Placeholder finalize - can add validation logic here if needed
    }
    
    
    /**
     * Prove credit score meets threshold
     * ZK Range Proof: Proves score >= threshold without revealing exact score
     * Example: Prove "score > 650" to qualify for loan
     */
    transition prove_score_threshold(
        credit_profile: CreditProfile,
        public threshold: u16
    ) -> bool {
        
        // Generate zero-knowledge proof
        // Returns true/false publicly, but score remains private
        let meets_threshold: bool = credit_profile.score >= threshold;
        
        return meets_threshold;
    }
    
    
    /**
     * Register user as verified borrower
     * Makes address publicly queryable (but not score)
     * Required before taking loans
     */
    async transition register_borrower(
        credit_profile: CreditProfile
    ) -> Future {
        
        // Verify minimum score requirement (600+)
        assert(credit_profile.score >= 600u16);
        
        return finalize_register(credit_profile.owner);
    }
    
    async function finalize_register(
        borrower: address
    ) {
        // Add to verified borrowers mapping
        Mapping::set(verified_borrowers, borrower, true);
        
        // Update total users count
        let current_count: u32 = Mapping::get_or_use(total_users, 0u8, 0u32);
        Mapping::set(total_users, 0u8, current_count + 1u32);
    }
    
    
    /**
     * Get collateral ratio based on credit score
     * Higher scores = lower collateral requirements
     * Returns basis points (e.g., 5000 = 50%)
     */
    transition calculate_collateral_ratio(
        credit_profile: CreditProfile
    ) -> u16 {
        let ratio: u16 = 0u16;
        
        // 800-850: 50% collateral
        if credit_profile.score >= 800u16 {
            ratio = 5000u16;
        } else {
            // 700-799: 75% collateral
            if credit_profile.score >= 700u16 {
                ratio = 7500u16;
            } else {
                // 650-699: 100% collateral
                if credit_profile.score >= 650u16 {
                    ratio = 10000u16;
                } else {
                    // 600-649: 125% collateral
                    if credit_profile.score >= 600u16 {
                        ratio = 12500u16;
                    } else {
                        // <600: 150% collateral
                        ratio = 15000u16;
                    }
                }
            }
        }
        
        return ratio;
    }
    
    
    // ============================================
    // HELPER FUNCTIONS (PRIVATE)
    // ============================================
    
    /**
     * Calculate credit score using weighted factors
     * Formula balances payment history, credit utilization, and defaults
     */
    inline calculate_score(
        on_time_payments: u8,
        late_payments: u8,
        defaults: u8,
        total_borrowed: u64,
        total_repaid: u64
    ) -> u16 {
        
        // Base score
        let score: u16 = 600u16;
        
        // Payment history factor (+5 per on-time payment, max +120)
        let payment_bonus: u16 = (on_time_payments as u16) * 5u16;
        if payment_bonus > 120u16 {
            payment_bonus = 120u16;
        }
        score = score + payment_bonus;
        
        // Late payment penalty (-15 per late payment)
        let late_penalty: u16 = (late_payments as u16) * 15u16;
        if score > late_penalty {
            score = score - late_penalty;
        } else {
            score = 300u16;  // Floor at minimum
        }
        
        // Default penalty (-50 per default)
        let default_penalty: u16 = (defaults as u16) * 50u16;
        if score > default_penalty {
            score = score - default_penalty;
        } else {
            score = 300u16;
        }
        
        // Credit utilization bonus (10% of borrowed = +20 points)
        if total_borrowed > 0u64 {
            let utilization_percent: u64 = (total_repaid * 100u64) / total_borrowed;
            if utilization_percent >= 90u64 {
                score = score + 30u16;  // Excellent repayment
            } else {
                if utilization_percent >= 70u64 {
                    score = score + 20u16;  // Good repayment
                } else {
                    if utilization_percent >= 50u64 {
                        score = score + 10u16;  // Fair repayment
                    }
                }
            }
        }
        
        // Cap score at maximum (850)
        if score > 850u16 {
            score = 850u16;
        }
        
        // Cap score at minimum (300)
        if score < 300u16 {
            score = 300u16;
        }
        
        return score;
    }
}
