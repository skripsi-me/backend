# File: .gemini/tasks/phase_5_orders.md

## PHASE 5: CARTS & ORDER MANAGEMENT (COD)
1. **Objective:** Implement shopping carts and MVP checkout flow.
2. **Execution Steps:**
   * Implement the `carts` module to manage user session items.
   * Implement the `orders` module.
   * Enforce Cash on Delivery (COD) logic. Strictly bypass electronic payment gateway integrations.
   * Implement manual status transitions (e.g., `PENDING` -> `SHIPPED` -> `DELIVERED`) restricted to Admin or Courier roles.