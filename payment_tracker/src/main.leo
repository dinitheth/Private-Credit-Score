// ================================================
// Payment History Tracker (Simplified)
// ================================================
// Maintains payment statistics without complex arrays
// Leo has limited array support, so we use aggregated stats

program payment_trackerv1.aleo {
    
    // ============================================
    // DATA STRUCTURES
    // ============================================
    
    // Aggregated payment statistics (no arrays)
    record PaymentStats {
        owner: address,
        on_time_payments: u8,     // Count of on-time payments
        late_payments: u8,         // Count of late payments
        default_payments: u8,      // Count of defaults
        total_payments: u32,       // Total payment count
        last_payment_block: u32,   // Most recent payment block
        total_amount_paid: u64,    // Cumulative payment amount
    }
    
    // ============================================
    // PUBLIC MAPPINGS
    // ============================================
    
    // Hash commitment for stats verification
    mapping stats_commitments: address => field;
    
    // Total payments processed (anonymous stats)
    mapping total_payments: u8 => u32;
    
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
     * Initialize payment stats for new user
     * Creates empty statistics record
     */
    transition initialize_payment_stats(
        public owner: address
    ) -> PaymentStats {
        
        let stats: PaymentStats = PaymentStats {
            owner: owner,
            on_time_payments: 0u8,
            late_payments: 0u8,
            default_payments: 0u8,
            total_payments: 0u32,
            last_payment_block: 0u32,
            total_amount_paid: 0u64,
        };
        
        return stats;
    }
    
    
    /**
     * Record new payment event
     * Updates aggregated statistics
     */
    async transition record_payment(
        payment_stats: PaymentStats,
        public loan_id: field,
        public payment_amount: u64,
        public payment_status: u8,
        public current_block: u32
    ) -> (PaymentStats, Future) {
        
        // Update counters based on payment status
        let new_on_time: u8 = payment_stats.on_time_payments;
        let new_late: u8 = payment_stats.late_payments;
        let new_defaults: u8 = payment_stats.default_payments;
        
        if payment_status == 0u8 {
            new_on_time = new_on_time + 1u8;
        } else if payment_status == 1u8 {
            new_late = new_late + 1u8;
        } else {
            new_defaults = new_defaults + 1u8;
        }
        
        // Create updated stats
        let updated_stats: PaymentStats = PaymentStats {
            owner: payment_stats.owner,
            on_time_payments: new_on_time,
            late_payments: new_late,
            default_payments: new_defaults,
            total_payments: payment_stats.total_payments + 1u32,
            last_payment_block: current_block,
            total_amount_paid: payment_stats.total_amount_paid + payment_amount,
        };
        
        // Generate commitment for verification
        let commitment: field = calculate_stats_commitment(
            new_on_time,
            new_late,
            new_defaults
        );
        
        return (updated_stats, finalize_payment_record(payment_stats.owner, commitment));
    }
    
    async function finalize_payment_record(
        owner: address,
        commitment: field
    ) {
        // Store commitment for verification
        Mapping::set(stats_commitments, owner, commitment);
        
        // Update total payments count
        let current_total: u32 = Mapping::get_or_use(total_payments, 0u8, 0u32);
        Mapping::set(total_payments, 0u8, current_total + 1u32);
    }
    
    
    /**
     * Verify payment stats authenticity
     * Checks stored commitment matches computed commitment
     */
    async transition verify_payment_stats(
        payment_stats: PaymentStats
    ) -> (bool, Future) {
        
        // Calculate commitment from current stats
        let computed_commitment: field = calculate_stats_commitment(
            payment_stats.on_time_payments,
            payment_stats.late_payments,
            payment_stats.default_payments
        );
        
        return (true, finalize_verify_stats(payment_stats.owner, computed_commitment));
    }
    
    async function finalize_verify_stats(
        owner: address,
        computed_commitment: field
    ) {
        // Get stored commitment
        let stored_commitment: field = Mapping::get(stats_commitments, owner);
        
        // Verify they match
        assert_eq(stored_commitment, computed_commitment);
    }
    
    
    /**
     * Get payment statistics
     * Returns aggregated counts
     */
    transition get_payment_stats(
        payment_stats: PaymentStats
    ) -> (u8, u8, u8, u32) {
        
        return (
            payment_stats.on_time_payments,
            payment_stats.late_payments,
            payment_stats.default_payments,
            payment_stats.total_payments
        );
    }
    
    
    /**
     * Calculate payment success rate
     * Returns percentage in basis points (10000 = 100%)
     */
    transition calculate_success_rate(
        payment_stats: PaymentStats
    ) -> u16 {
        
        let total: u8 = payment_stats.on_time_payments + payment_stats.late_payments + payment_stats.default_payments;
        
        if total == 0u8 {
            return 0u16;
        }
        
        // Calculate percentage: (on_time / total) * 10000
        let rate: u16 = ((payment_stats.on_time_payments as u16) * 10000u16) / (total as u16);
        
        return rate;
    }
    
    
    // ============================================
    // HELPER FUNCTIONS
    // ============================================
    
    /**
     * Calculate commitment hash for stats
     * Used for verification
     */
    inline calculate_stats_commitment(
        on_time: u8,
        late: u8,
        defaults: u8
    ) -> field {
        
        // Combine all values into a single hash
        // Use hash_to_field which returns field type directly
        let combined_value: u64 = (on_time as u64) * 1000000u64 + (late as u64) * 1000u64 + (defaults as u64);
        let commitment: field = BHP256::hash_to_field(combined_value);
        
        return commitment;
    }
}
