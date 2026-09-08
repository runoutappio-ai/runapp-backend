package com.runout.shared;

import java.math.BigDecimal;
import java.util.Currency;

public record Money(BigDecimal amount, Currency currency) {

    public Money {
        if (amount.signum() < 0) throw new IllegalArgumentException("Amount cannot be negative");
    }
}
